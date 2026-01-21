// Simple customization entrypoint for public use.
// Edit values below (no build step needed).
window.LOVE_LETTER_CONFIG = {
  recipientName: "Pen",
  title: "Hello",
  // Write your message as an array of paragraphs.
  message: [
    "Sometimes i think about timing, and how rarely it lines up the way people expect. Yet, we met when neither of us was ready for anything new. You were healing at the time and keeping your distance. While i wasn’t expecting to feel anything serious. But over time, i realized i cared about you more than i meant to.",

    "There were many times when i didn’t understand your decisions and frankly most of the time i disagreed. Times when the way you moved through things made me feel that you were distant to me. I know you felt the same about me at that time. we are different people, and sometimes we speak past each other without meaning to. Wanting you didn’t always come with understanding. But then, you were the one who pulled away, and i didn't understand why even when it hurt. I wanted you before you were ready to let anyone close, and i didn’t know what to do with that feeling except sit with it.",

    "Then there were those months when we didn’t talk. Life kept moving, but something important felt unfinished. Even when i tried forgetting about you, for some reason i just cant. When we eventually found our way back, we still didn’t understand each other. we argued over small things that carried more weight than they should have. But i knew what i wanted even when i couldn’t explain it well. I wanted you. So when you said yes on December 30, it didn’t feel all that sudden. it felt more like something that really took time to become true.",

    "And now, today you graduate. People will see the smiles and the photos and call it an achievement. I see the work behind it. the days you were tired. the moments you doubted yourself. I watched you keep going anyway, even if you tired, lazy, or under pressure. That’s what makes me proud of you. not just how you achieved it, but everything that it took to get there.",

    "I loved you before we had a name for us. I love you now that we do. i don’t expect us to understand each other perfectly all the time. but i want to keep learning from you, and i want you to keep learning me. whatever comes after today, i want to face it with you."
  ],
  signature: "— Adrian",

  // Collapsed (peek) placeholder line count
  peekLineCount: 11,

  // Sound timing tweak: these paper samples have a bit of leading silence.
  // Increase to make the sound happen sooner; decrease if it feels too early.
  // (Seconds to skip from the start of the file.)
  sfx: {
    envelopeSeekSeconds: 2.0,
    letterSeekSeconds: 1.0,

    // Envelope close can use a different slice (usually shorter/snappier)
    envelopeCloseSeekSeconds: 2.1,

    // Trim the sound so it doesn't "trail" after the animation/click.
    // (Seconds to play, after seeking. Set to 0 to play the whole file.)
    envelopePlaySeconds: 0.65,
    letterPlaySeconds: 0.45,

    envelopeClosePlaySeconds: 0.45,
  },

  // Floating hearts background
  hearts: {
    enabled: true,
    max: 42,
    // Spawn interval range (ms)
    spawnMs: [260, 520],
    // Heart radius range (px)
    size: [32, 64],
    // Upward speed range (px/s)
    riseSpeed: [40, 95],

    pop: {
      enabled: true,
      sound: true,
    },
  },
};
