<template>
  <div class="game-overlays">
    <v-overlay
      id="waiting-for-opponent-counter-scrim"
      v-model="waitingForOpponentToCounter"
      opacity=".6"
    >
      <h1>{{ showWaitingForOpponetToCounterMessage }}</h1>
    </v-overlay>
    <v-overlay
      id="waiting-for-opponent-discard-scrim"
      v-model="waitingForOpponentToDiscard"
      opacity=".6"
    >
      <h1>Opponent Is Discarding</h1>
    </v-overlay>
    <v-overlay
      id="waiting-for-opponent-resolve-three-scrim"
      v-model="waitingForOpponentToPickFromScrap"
      opacity=".6"
    >
      <h1>Opponent Choosing Card from Scrap</h1>
    </v-overlay>
    <v-overlay
      id="waiting-for-opponent-play-from-deck-scrim"
      v-model="showWaitingForOpponentToPlayFromDeck"
      opacity=".6"
    >
      <h1>Opponent Playing from Deck</h1>
    </v-overlay>
    <v-overlay
      id="waiting-for-opponent-to-discard-jack-from-deck"
      v-model="showWaitingForOpponentToDiscardJackFromDeck"
      opacity=".6"
    >
      <h1>Opponent Must Discard Jack</h1>
    </v-overlay>
    <v-overlay
      id="waiting-for-opponent-stalemate-scrim"
      v-model="waitingForOpponentToStalemate"
      opacity=".6"
    >
      <h1>Opponent Considering Stalemate Request</h1>
    </v-overlay>
    <move-choice-overlay
      v-if="selectedCard || cardSelectedFromDeck"
      :value="!targeting && (!!selectedCard || !!cardSelectedFromDeck)"
      :selected-card="selectedCard || cardSelectedFromDeck"
      :is-players-turn="isPlayersTurn"
      :opponent-queen-count="opponentQueenCount"
      :frozen-id="player.frozenId"
      @points="$emit('points')"
      @faceCard="$emit('face-card')"
      @oneOff="$emit('one-off')"
      @scuttle="handleTargeting"
      @jack="handleTargeting"
      @targetedOneOff="handleTargeting"
      @cancel="$emit('clear-selection')"
    />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';

import MoveChoiceOverlay from '@/components/GameView/MoveChoiceOverlay.vue';

export default {
  name: 'GameOverlays',
  components: {
    MoveChoiceOverlay,
  },
  props: {
    targeting: {
      type: Boolean,
      required: true,
    },
    selectedCard: {
      type: Object,
      default: null,
    },
    cardSelectedFromDeck: {
      type: Object,
      default: null,
    },
  },
  computed: {
    // Since we're not using namespacing, we need to destructure the game module
    // off of the global state to directly access the state values
    ...mapState({
      waitingForOpponentToCounter: ({ game }) => game.waitingForOpponentToCounter,
      waitingForOpponentToDiscard: ({ game }) => game.waitingForOpponentToDiscard,
      waitingForOpponentToPickFromScrap: ({ game }) => game.waitingForOpponentToPickFromScrap,
      waitingForOpponentToPlayFromDeck: ({ game }) => game.waitingForOpponentToPlayFromDeck,
      waitingForOpponentToStalemate: ({ game }) => game.waitingForOpponentToStalemate,
      topCard: ({ game }) => game.topCard,
      secondCard: ({ game }) => game.secondCard,
    }),
    ...mapGetters([
      'isPlayersTurn',
      'playerQueenCount',
      'opponentQueenCount',
      'opponentPointTotal',
      'opponent',
      'hasGlassesEight',
      'player',
      'resolvingSeven',
    ]),
    showWaitingForOpponetToCounterMessage() {
      const mayCounter = 'Opponent May Counter';
      const mustResolve = 'Opponent Must Resolve';
      const opponentHasTwo = this.opponent.hand.some((card) => card.rank === 2);
      if (this.playerQueenCount || (this.hasGlassesEight && !opponentHasTwo)) {
        return mustResolve;
      }
      return mayCounter;
    },
    showWaitingForOpponentToDiscardJackFromDeck() {
      return (
        this.waitingForOpponentToPlayFromDeck &&
        this.topCard.rank === 11 &&
        (!this.secondCard || this.secondCard.rank === 11) &&
        (this.opponentPointTotal === 0 || this.opponentQueenCount > 0)
      );
    },
    showWaitingForOpponentToPlayFromDeck() {
      return (
        this.waitingForOpponentToPlayFromDeck && !this.showWaitingForOpponentToDiscardJackFromDeck
      );
    },
  },
  methods: {
    handleTargeting(event) {
      this.$emit('target', event);
    },
  },
};
</script>
