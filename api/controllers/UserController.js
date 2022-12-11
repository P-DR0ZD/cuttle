/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

//////////////////
// DEPENDENCIES //
//////////////////

const userAPI = sails.hooks['customuserhook'];
const passwordAPI = sails.hooks['custompasswordhook'];

module.exports = {
  signup: async function (req, res) {
    try {
      const { username, password } = req.body;
      const foundUser = await User.findOne({ username: username });
      if (foundUser) {
        throw {
          message: 'That username is already registered to another user; try logging in!',
        };
      }
      // Encrypt pw and create new user
      const encryptedPassword = await passwordAPI.encryptPass(password);
      const user = await userAPI.createUser(username, encryptedPassword);
      // Successfully created User - Set session data
      req.session.loggedIn = true;
      req.session.usr = user.id;
      return res.ok(user.id);
    } catch (err) {
      return res.badRequest(err);
    }
  },
  login: async function (req, res) {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username: username });
      if (!user) {
        throw {
          message: 'Could not find that user with that username. Try signing up!',
        };
      }
      await passwordAPI.checkPass(password, user.encryptedPassword);
      req.session.loggedIn = true;
      req.session.usr = user.id;
      return res.ok(user.id);
    } catch (err) {
      return res.badRequest(err);
    }
  },
  reLogin: function (req, res) {
    userAPI
      .findUserByUsername(req.body.username)
      .then(function gotUser(user) {
        const checkPass =
          !req.session.loggedIn && req.body.password
            ? passwordAPI.checkPass(req.body.password, user.encryptedPassword)
            : null;
        const promiseGame = gameService.populateGame({ gameId: user.game });
        return Promise.all([promiseGame, Promise.resolve(user), checkPass]);
      })
      .then((values) => {
        const game = values[0];
        const user = values[1];
        req.session.loggedIn = true;
        req.session.usr = user.id;
        req.session.game = game.id;
        req.session.pNum = user.pNum;
        Game.subscribe(req, [game.id]);
        sails.sockets.join(req, 'GameList');
        Game.publish([game.id], {
          verb: 'updated',
          data: {
            ...game.lastEvent,
            game,
          },
        });

        return res.ok();
      })
      .catch((err) => {
        return res.badRequest(err);
      });
  },

  logout: async function (req, res) {
    await sails.helpers.logout(req);
    return res.ok();
  },

  submitEmail: async function (req, res) {
    try {
      const { username, email } = req.body;
      const updatedUser = await User.updateOne({ username: username }).set({ email: email });
      if (updatedUser) {
        return res.ok(updatedUser.id);
      }
      throw 'Unable to Save Email to User';
    } catch (err) {
      return res.badRequest(err);
    }
  },

  findEmail: async function (req, res) {
    try {
      const { username } = req.body;
      const foundUser = await User.findOne({ username: username });
      if (foundUser) {
        return res.ok(foundUser.email);
      }
      throw 'Unable to Find User Email';
    } catch (err) {
      return res.badRequest(err);
    }
  },

  status: async function (req, res) {
    const { usr: id, loggedIn: authenticated, game: gameId } = req.session;

    // User is not logged in, get out of here
    if (!authenticated || !id) {
      return res.ok({
        authenticated: false,
      });
    }

    try {
      // If the user is logged in, see if we can find them first to verify they exist
      const { username } = await userAPI.findUser(id);
      const game = gameId ? await gameService.findGame({ gameId }) : null;
      return res.ok({
        id,
        username,
        authenticated,
        // We only want to set the gameId if this is a valid game with 2 players
        // TODO: Refactor this when we add session handling for the lobby
        gameId: game && game.players.length === 2 ? gameId : null,
      });
    } catch (err) {
      // Something happened and we couldn't verify the user, log them out
      await sails.helpers.logout(req);
      return res.badRequest(err);
    }
  },
};
