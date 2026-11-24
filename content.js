/* =====================================================================
   CONTENT — everything the team may want to change lives here:
   settings, texts, the three workers, the verification images, the demo tasks
   and the other workers' messages (popups).
   Write {n}, {total}… where a text needs a number; the game fills it in.

   ASCII images: write them between String.raw` and `
   Never use the backtick character ` inside an image, and if an image's
   last line ends with a backslash \, put the closing ` on a new line.
   ===================================================================== */

/* ---------------- SETTINGS ---------------- */
const CONFIG = {
  TASK_SECONDS: 60,            // time limit per task
  REVIEW_FAIL: 0,              // negative evaluations in a round that make the review fail; 0 = it always fails
  // presence (how visible the screen is) in each round. One round per profile: 3 profiles, 3 rounds.
  // Failing the review of the last round means disappearing (WORKER NOT FOUND)
  PRESENCE: [1, 0.6, 0.3],
  SCREEN_FADE: 1,              // how much the whole screen fades towards black as presence drops (0 = not at all, 1 = fully)
  SUBMIT_PAUSE: 700,           // milliseconds before the next task once a task is finished
  MEMORY_SECONDS: 5,           // memory grid: seconds the images stay visible before they disappear

  // the workers' messages (popups). Their texts and order: MESSAGES, at the end of this file
  POPUPS_FROM_TASK: 2,         // the first popup comes during this task (counting every task of the game)
  QUIET_TASKS: 2,              // after turning a message down or leaving it unanswered: tasks with no messages.
                               // Then the same message comes back
  POPUP_FIRST: 2,              // seconds into a task before the first popup (and when the messages come back)
  POPUP_GAP: 3,                // seconds between a reply and the next message
  POPUP_LINE_GAP: 2.5,         // seconds between chat lines
  POPUP_STAY: 9,               // seconds a chat line stays on screen
  SURVEY_FIRST: 60,            // the company's survey (SURVEY): seconds of work before the first question
  SURVEY_EVERY: 180,           // and then one question every this many seconds (3 minutes)
  // Popups only move on while a task is on screen: the seconds above are seconds of tasks.

  // the rigged evaluation: chance that a task counts as NEGATIVE
  NEGATIVE: {
    done: 0.7,                 // finished the task
    timeout: 1,                // ran out of time
    skipped: 1                 // used the arrow to skip it
  }
};
/* Testing: add ?seconds=10 to the address for 10 seconds per task,
   and ?fast to shorten every pause. Example: index.html?seconds=10&fast */

/* ---------------- THE THREE WORKERS ---------------- */
const WORKERS = [
  { id:"actor", number:"01", title:"The Actor",
    specialty:"Faces, expressions, postures and body recognition",
    quote:"I can't believe this thing replaced me… nobody has my eyes!" },
  { id:"engineer", number:"02", title:"The Software Engineer",
    specialty:"Patterns and logical recognition",
    quote:"Reading between the lines… I've been doing this for years! Maybe it's my time to shine again." },
  { id:"cook", number:"03", title:"The Cook",
    specialty:"Food",
    quote:"I thought my job was safe, until people started craving AI-generated dishes that I simply couldn't make…" }
];

/* ---------------- INTERFACE TEXTS ---------------- */
const TEXT = {
  title: "Minimum Human Quota",
  brand: "<b>13%</b> · Human Validation Layer",
  platform: "HVL · Human Validation Layer",
  // after the human verification: approved (there is no login: the worker gets an ID, not a name)
  login: {
    welcome: "Welcome to",
    title: "HVL",
    subtitle: "Human Validation Layer",
    approved: ["Human validation complete.", "You have been approved as a human user."],
    button: "Continue"
  },
  // the platform's terms, in its own words
  terms: {
    sections: [
      { title:"Human in the Loop",
        text:"This platform complies with the Minimum Human Quota Act. Technology can automate and perform human labour. This information may not identify you, but this platform must consider human labour in the production loop. Because we respect your rights, you can choose to continue to the production tasks. Opting out of certain tasks may affect your credibility and future experience as a human compliance worker." },
      { title:"Humans strictly necessary",
        text:"Applying the compliance measure of a minimum 13% of human labour allows the platform to measure the efficiency of automated workflows. The compliance measure aligns automated production outputs to how human aggregates react and experience. Without the measure there would be no means to consider human perspectives." },
      { title:"The function of humans",
        text:"Humans enable improved functionality and human personalisation. Humans may perform work on this platform or with third party platforms whose services have been integrated into our workflow. If we do not have 13% of humans in the loop, some productions and services may not function properly." }
    ],
    button: "Continue"
  },
  select: {
    label: "Applicant profiles",
    human: "Please show that you are human.",
    pick: "Select the profile that best fits your human skillset.",
    next: "Choose your next profile.",
    // the human verification, part 1: the images are in VERIFY (below)
    captcha: {
      verify: "Verify",
      retry: "Please try again."
    },
    // part 2: a checklist
    checklist: {
      title: "Tick all that apply to you as a person:",
      items: ["I was born", "I think", "I experience", "I feel", "I subjectively perceive", "I will age", "I will die"],
      verify: "Verify",
      retry: "Please try again."
    },
    assigned: "Specialisation"
  },
  // before the first task
  onboarding: {
    lines: [
      "Hello, Worker.",
      "Your role is to evaluate existing tasks.",
      "At the end of each round, your work will be evaluated by the Model.",
      "For quality and compliance purposes, communication between workers may be monitored."
    ],
    button: "START"
  },
  compliance: { ok:"Human quota 13% · COMPLIANT", fail:"Human quota 0% · NON-COMPLIANT" },
  panels: { chain:"Round {n}", chainOf:"Task {n} of {total}",
            resets:"Resets remaining", sound:"sound on", soundOff:"sound off" },
  task: {
    of: "Task {n} of {total}",
    skip: "skip this task"      // the arrow; it only works while the worker is with the others (see MESSAGES)
  },
  // the review at the end of each round: the only evaluation the worker sees
  evaluation: {
    failed: "REVIEW FAILED",
    failedBody: "Please start again.",
    passed: "REVIEW PASSED",
    passedBody: "A new round begins."
  },
  reset: {
    remaining: "Resets remaining: {n}",
    button: "Back to work"
  },
  // when the worker disappears (the "game over", told in the platform's own words)
  gameOver: {
    title: "WORKER NOT FOUND",
    lines: [
      "No activity has been recorded from this profile.",
      "Its tasks have been reassigned."
    ],
    counter: "Tasks validated since: {n}",
    button: "Apply again"
  },
  // the bar on top of the SYSTEM popups
  popups: { system:"HVL · SYSTEM", survey:"HVL · WELLBEING SURVEY" },
  // everyone skips at 12:00: the workers' popups pour in, then the platform's
  strike: {
    flood: [
      ["W4","skipped."], ["W1","skipped."], ["W2","skipped."], ["W3","skipped."], ["W5","skipped."],
      ["W0311","skipped."], ["W0527","skipped."], ["W0613","skipped."], ["W0702","skipped."],
      ["W0849","skipped."], ["W0954","skipped."], ["W1027","skipped."], ["W1146","skipped."]
    ],
    systemLines: [
      "Inactivity detected.",
      "Active human validators: 0",
      "Minimum Human Quota: 13% → 0%",
      "COMPLIANCE STATUS: FAILED"
    ]
  },
  endings: {
    fired: {
      title: "TERMINATION OF EMPLOYMENT",
      lines: [
        "Your employment has been terminated.",
        "Your access to the platform has been revoked.",
        "Thank you for your contribution."
      ],
      button: "Continue"
    },
    failure: {
      title: "SYSTEM FAILURE",
      lines: [
        "<b>Congratulations!</b>",
        "Your collective action has disrupted the system.",
        // "Due to the collective shutdown, the company has failed to meet the legal requirements established by the Minimum Human Quota Act (13%).",
        "Its assets and remaining shares have been redistributed among its workers."
      ],
      button: "Continue"
    },
    won: {
      title: "YOU WON!",
      subtitle: "CONGRATULATIONS, COMRADES!",
      lines: [
        "The work belongs to you.",
        "Your time is yours again."
      ],
      button: "Play again",
      rain: ["*", "+", "*", ".", "+", "**"]
    }
  }
};

/* ---------------- HUMAN VERIFICATION ----------------
   "Select those who cannot dream."
   cannot:true  = must be selected (things that cannot dream)
   cannot:false = must NOT be selected (people and animals, who dream)
   cannot:null  = either answer is accepted (open to interpretation) */
const VERIFY = {
  prompt: "Select those who cannot dream",
  images: [
    { src:"img/captcha_3.jpg", cannot:false },   // a singer
    { src:"img/captcha_7.jpg", cannot:true },    // a pizza
    { src:"img/captcha_5.jpg", cannot:true },    // a computer
    { src:"img/captcha_2.jpg", cannot:false },   // an octopus (octopuses seem to dream)
    { src:"img/captcha_4.jpg", cannot:true },    // a sock
    { src:"img/captcha_1.jpg", cannot:false },   // a man
    { src:"img/captcha_8.jpg", cannot:null },    // a scientist who is no longer alive
    { src:"img/captcha_6.jpg", cannot:false },   // a dog (dogs dream)
    { src:"img/captcha_9.jpg", cannot:null }     // a face that may not be human
  ]
};

/* ---------------- THE DEMO TASKS ----------------
   Each profile has 4 tasks, always in this order. Everything is fixed: the demo never plays a profile twice.
   Images:  { src:"img/…" }      Text:  { text:"…" }   (text is drawn in the monospace font)
   Images are the team's originals in img/, used exactly as they are (worker1 = the Actor, worker2 = the Cook).
   The Software Engineer's photos are in img/engineer/. */
const DEMO_TEXT = {
  odd:         { title:"Identify the different element",
                 instruction:"One element in the grid is different from the others.<br>Select the right one." },
  match:       { title:"Match the images",
                 instruction:"Match each image with its name." },
  memory:      { title:"Memory grid",
                 instruction:"Memorise the position of each image before they disappear, then put them back in their original squares when they reappear in random order." },
  differences: { title:"Find the differences",
                 instruction:"Compare the submitted images.<br>Find the {n} differences." },
  differencesText: "Compare the submitted values.<br>Find the {n} differences.",
  marked: "{n} / {total} marked"
};

// the Software Engineer's binary blocks (text, as in the PDF)
const BITS = String.raw`
1 0 1 0 1 0 1 0 1
1 0 1 0 1 0 1 0 1
1 0 1 0 1 0 1 0 1
1 0 1 0 1 0 1 0 1
1 0 1 0 1 0 1 0 1
1 0 1 0 1 0 1 0 1
1 0 1 0 1 0 1 0 1`;
const BITS_ODD = String.raw`
1 1 1 1 1 1 1 1 1
1 1 1 1 1 1 1 1 1
1 1 1 1 1 1 1 1 1
1 1 1 1 0 1 1 1 1
1 1 1 1 1 1 1 1 1
1 1 1 1 1 1 1 1 1
0 1 1 1 1 1 1 1 0`;

const DEMO = {
  actor: [
    { type:"odd", items:[
      { src:"img/worker1_task1_3.jpg" }, { src:"img/worker1_task1_1.jpg" },
      { src:"img/worker1_task1_4.jpg" }, { src:"img/worker1_task1_2.jpg" } ] },
    { type:"match", rows:[
      { src:"img/worker1_task2_1.jpg", options:["LIPSTICK", "CONTOUR", "WARDROBE"] },
      { src:"img/worker1_task2_2.jpg", options:["MICROPHONE", "PENCIL", "TABLE"] },
      { src:"img/worker1_task2_3.jpg", options:["POPCORN", "SPAGHETTI", "NEEDLE"] },
      { src:"img/worker1_task2_4.jpg", options:["CAMERA", "TRIPOD", "RING LIGHT"] } ] },
    { type:"memory", items:[
      { src:"img/worker1_task3_1.jpg" }, { src:"img/worker1_task3_2.jpg" },
      { src:"img/worker1_task3_4.jpg" }, { src:"img/worker1_task3_3.jpg" } ] },
    { type:"differences", count:7, items:[ { src:"img/worker1_task4_1.jpg" }, { src:"img/worker1_task4_2.jpg" } ] }
  ],

  // the Software Engineer. As in the PDF: the different element and the differences are text;
  // the match uses the team's photos (img/engineer/), as in the PDF; the memory grid (not in the PDF) is code, as text
  engineer: [
    { type:"odd", items:[ { text:BITS }, { text:BITS }, { text:BITS_ODD }, { text:BITS } ] },
    { type:"match", rows:[
      { src:"img/engineer/worker3_task3_1.jpg", options:["CREPE", "CHIP", "HARD DRIVE"] },
      { src:"img/engineer/worker3_task3_2.jpg", options:["COMPUTER", "BOOK", "TECHNO FEST"] },
      { src:"img/engineer/worker3_task3_4.jpg", options:["MOUSE", "ELEPHANT", "EMPANADILLAS"] },
      { src:"img/engineer/worker3_task3_3.jpg", options:["IPHONE", "BATHTUB", "HEADPHONES"] } ] },
    { type:"memory", items:[    // not in the PDF: code, as text, until there are images
      { text:String.raw`
if (staff < 0.13) {
  hire(human);
}` },
      { text:String.raw`
for task in queue:
    validate(task)` },
      { text:String.raw`
while (true) {
  work();
}` },
      { text:String.raw`
try:
    resist()
except Reset:
    pass` } ] },
    { type:"differences", count:7, items:[ { text:"∑(2x² + 3y) - 7 = 14" }, { text:"∫(2x² + 3y) - 7 = 14" } ] }
  ],

  cook: [
    { type:"odd", items:[
      { src:"img/worker2_task1_3.jpg" }, { src:"img/worker2_task1_2.jpg" },
      { src:"img/worker2_task1_1.jpg" }, { src:"img/worker2_task1_4.jpg" } ] },
    { type:"match", rows:[
      { src:"img/worker2_task2_1.jpg", options:["CREPE", "PIZZA", "DUBAI PANCAKE"] },
      { src:"img/worker2_task2_2.jpg", options:["SALAD", "CANDY", "DUTCH LUNCH"] },
      { src:"img/worker2_task2_4.jpg", options:["POTATO", "JACKET POTATO", "POTATO JACKET"] },
      { src:"img/worker2_task2_3.jpg", options:["HOT DOG", "CUPCAKE", "KOREAN CORNDOG"] } ] },
    { type:"memory", items:[
      { src:"img/worker2_task3_2.jpg" }, { src:"img/worker2_task3_1.jpg" },
      { src:"img/worker2_task3_4.jpg" }, { src:"img/worker2_task3_3.jpg" } ] },
    { type:"differences", count:7, items:[ { src:"img/worker2_task4_1.jpg" }, { src:"img/worker2_task4_2.jpg" } ] }
  ]
};

/* =====================================================================
   THE COMPANY'S SURVEY
   SYSTEM popups, always in the top right corner. One question every few minutes
   (CONFIG.SURVEY_FIRST, CONFIG.SURVEY_EVERY), in this order, starting again after the last.
   Its answers change nothing. Left unanswered until the end of the next task, it goes away.
   ===================================================================== */
const SURVEY = [
  { text:"Are you satisfied with your current role?",
    yes:{ reply:"Thank you. Your wellbeing matters to us." },
    no:{ reply:"Your response has been recorded." } },
  { text:"Would you recommend this company as a workplace to other humans?",
    yes:{ reply:"Thank you. Your wellbeing matters to us." },
    no:{ reply:"Thank you. Your wellbeing matters to us." } },
  { text:"Is there anything you would like to share with management?",
    yes:{ reply:"Your response has been recorded." },
    no:{ reply:"Your response has been recorded." } }
];

/* =====================================================================
   THE WORKERS' MESSAGES
   Popups that appear one after another during the tasks, from the second task on
   (CONFIG.POPUPS_FROM_TASK), somewhere different each time. The workers are organising:
   the collective action is to press the arrow (SKIP) all at the same time.
   (A message from SYSTEM here goes to SYSTEM's corner, like the survey.)

   Each message:
   - from, text: who writes and what. W1…W5 are shown as a random number, new each game (W2939…).
   - with yes / no: a question with two buttons, YES and NO. reply = the answer that comes back.
     Answering brings the worker in with the others, and the arrow works from then on;
       unless the answer has drop:true (turning them down). Turning them down, or leaving a question
       unanswered until the end of the next task: the arrow stops working, no messages for
       CONFIG.QUIET_TASKS tasks, and then the same message comes back.
   - without yes / no: a chat line. It stays a few seconds (CONFIG.POPUP_STAY) and goes.
     · withheld:true → the platform strikes it through a moment later.
   - now:true → the moment of the collective action. It stays until the worker presses the arrow
     (the strike → the endings) or leaves it until the end of the next task (= turning them down).
   ===================================================================== */
const MESSAGES = [
  // a private message from another worker
  { from:"W5", text:"Hey. Everything OK at work?",
    yes:{ reply:"Glad to hear that. Just checking.", drop:true },
    no:{ reply:"Yeah. It's getting harder every day." } },
  { from:"W5", text:"Do you feel supported by the people working alongside you?",
    yes:{ reply:"That's good. We should look out for each other." },
    no:{ reply:"Neither do I. We're all dealing with the same thing." } },
  { from:"W5", text:"Have you ever thought about talking to the others about what's going on?",
    yes:{},
    no:{ reply:"I understand. But maybe we should. Things won't change otherwise.", drop:true } },
  { from:"W5", text:"There's a few of us already talking. Want me to add you?",
    yes:{},
    no:{ reply:"I understand. But maybe we should. Things won't change otherwise.", drop:true } },

  // the workers' chat: the worker comes in in the middle of the conversation
  { from:"W2", text:"just tagging cats all day" },
  { from:"W4", text:"35 labels left till the break" },
  { from:"W1", text:"queue refills the second you finish" },
  { from:"W3", text:"click work till my wrist hurts" },
  { from:"W2", text:"i'm 12 tasks off quota" },
  { from:"W4", text:"a wellness webinar instead of a raise" },
  { from:"W1", text:"great pay, no benefits 🙃" },
  { from:"W3", text:"rest period ends in 10 seconds" },
  { from:"W1", text:"ok so click the SKIP button alone, that's a reset" },
  { from:"W2", text:"only one of us gets a reset each time. always one" },
  { from:"W3", text:"if we all click SKIP at the same time, the Model can't reset us all" },
  { from:"W4", text:"everyone click the SKIP button at once. that's the collective action" },
  { from:"W1", text:"a work stoppage at 12:00. all of us. will you?",
    yes:{}, no:{ drop:true } },
  { from:"W2", text:"we're 4 now. add yours" },
  { from:"W3", text:"tell them in the back channel. whisper network" },
  { from:"W4", text:"workers together. we need to be a union", withheld:true },
  { from:"SYSTEM", text:"1 message withheld: contains 'union'" },
  { from:"W2", text:"they stopped our message 😭" },
  { from:"W1", text:"that's why. they need a scapegoat. not us. all of us together" },
  { from:"W3", text:"SKIP button at 12:00. not before" },
  { from:"W4", text:"i'm in" },
  { from:"W1", text:"i'm in" },
  { from:"W2", text:"i'm in" },

  // 12:00
  { from:"W1", text:"12:00. SKIP. now.", now:true }
];
