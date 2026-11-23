/* =====================================================================
   CONTENT — everything the team may want to change lives here:
   settings, texts, the three workers, the task images (text-based), the task
   material and the story (messages, the question, the union, endings).
   Write {n}, {total}… where a text needs a number; the game fills it in.

   ASCII images: write them between String.raw` and `
   Never use the backtick character ` inside an image, and if an image's
   last line ends with a backslash \, put the closing ` on a new line.
   ===================================================================== */

/* ---------------- SETTINGS ---------------- */
const CONFIG = {
  TASK_SECONDS: 60,            // time limit per task
  // what comes after each task of a round: "" (nothing), "rest" or "survey".
  // Its length is the number of tasks per round. Rest periods and surveys are switched off for the demo;
  // write "rest" or "survey" in a slot to bring them back.
  ROUND: ["", "", "", ""],
  REVIEW_FAIL: 0,              // negative evaluations in a round that make the review fail; 0 = it always fails
  // presence (how visible the screen is) in each round. One round per profile: 3 profiles, 3 rounds.
  // Failing the review of the last round means disappearing (WORKER NOT FOUND)
  PRESENCE: [1, 0.6, 0.3],
  SCREEN_FADE: 1,              // how much the whole screen fades towards black as presence drops (0 = not at all, 1 = fully)
  CHATS: false,                // the right column (Channel, Break room, chat) and the coworkers' messages. Off for the demo
  SUBMIT_PAUSE: 700,           // milliseconds before the next task once a task is finished
  MEMORY_SECONDS: 5,           // memory grid: seconds the images stay visible before they disappear

  // mandatory rest period (only if "rest" is in ROUND): no work allowed
  BREAK_SECONDS: 30,           // length of the rest period
  UNION_REOFFER_AFTER: 2,      // tasks before a coworker's message that was turned down comes back

  // the rigged evaluation: chance that a task counts as NEGATIVE (shown when comparing evaluations)
  NEGATIVE: {
    done: 0.7,                 // finished the task
    timeout: 1,                // ran out of time
    skipped: 1                 // used the arrow to skip it
  },

  GHOST_MESSAGE_CHANCE: [0.25, 0.45, 0.65, 0.9] // chance of a message from a disappeared worker after each task, by resets
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

/* ---------------- OTHER WORKERS (characters in the messages) ----------------
   disappeared:true shows only their ID: they have lost their name. */
const PEOPLE = {
  marisol: { name:"Marisol", id:"worker_0412" },
  ines:    { name:"Inés",    id:"worker_0230" },
  kwame:   { name:"Kwame",   id:"worker_0771" },
  tomas:   { name:"Tomás",   id:"worker_0098", disappeared:true },
  w1188:   { id:"worker_1188", disappeared:true },
  w0655:   { id:"worker_0655", disappeared:true },
  w2210:   { id:"worker_2210", disappeared:true },
  wxxxx:   { id:"worker_????", disappeared:true },
  hr:      { name:"Wellbeing team", id:"HVL" },
  system:  { name:"SYSTEM", id:"" }
};

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
            resets:"Resets remaining", channel:"Channel", breakroom:"Break room", sound:"sound on", soundOff:"sound off" },
  task: {
    of: "Task {n} of {total}",
    skip: "skip this task"      // the arrow; it only works once the worker has joined the others
  },
  // the review at the end of each round: the only evaluation the worker sees
  evaluation: {
    label: "Automated review · Round {n}",
    positive: "POSITIVE",
    negative: "NEGATIVE",
    actions: {
      validated: "validated",
      corrected: "corrected",
      timeout:   "out of time"
    },
    footer: "These decisions have been added to the Model's training data.",
    failed: "REVIEW FAILED",
    failedBody: "Please start again.",
    passed: "REVIEW PASSED",
    passedBody: "A new round begins."
  },
  rest: {
    header: "REST",
    label: "Mandatory rest period",
    text: "Work is unavailable until the rest period ends.",
    small: "Rest periods are not counted as working time."
  },
  // the wellbeing survey slot, between tasks
  surveyBreak: {
    header: "SURVEY",
    label: "Wellbeing survey",
    text: "Work resumes when the survey is complete.",
    small: "Participation is mandatory."
  },
  chat: {
    on: "write to the {tab} and press Enter",
    you: "you"
  },
  inbox: { text:"New message from {who}", open:"open" },
  reset: {
    remaining: "Resets remaining: {n}",
    // after joining the others, a failed review no longer makes the worker fade
    covered: "We covered for you.",
    coveredBy: "marisol",
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
  dialog: {
    direct: "Direct message",
    survey: "Wellbeing survey",
    placeholder: "type your reply and press Enter",
    backToWork: "back to work",
    restOver: "REST PERIOD OVER · back to work",
    interpreted: "Interpreted as: {answer}",
    normalised: "No clear answer detected. Response normalised to: {answer}",
    unclear: "Sorry, I didn't get that. Yes or no?",
    // hintsFrom: "Messages from others in the system",
    close: "Close"
  },
  strike: {
    from: "marisol",
    now: "now.",
    system: "Leaving a task unfinished will be recorded in your evaluation.",
    stop: "STOP WORKING",
    keep: "keep working",
    flood: [
      ["marisol","stopped."], ["kwame","stopped."], ["ines","stopped."],
      ["worker_0311","stopped."], ["worker_0527","stopped."], ["worker_0613","stopped."], ["worker_0702","stopped."],
      ["worker_0849","stopped."], ["worker_0954","stopped."], ["worker_1027","stopped."], ["worker_1146","stopped."],
      ["tomas","…stopped."]
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
   Images:  { src:"img/game/…" }      Text:  { text:"…" }   (text is drawn in the monospace font)
   Images are the team's originals in img/, used exactly as they are (worker1 = the Actor, worker2 = the Cook).
   The Software Engineer's are in img/game/ for now. */
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

  // the Software Engineer's images are made from text (numbers, drawings, code, formulas): img/game/engineer_…
  engineer: [
    { type:"odd", items:[ { src:"img/game/engineer_task1_1.jpg" }, { src:"img/game/engineer_task1_2.jpg" }, { src:"img/game/engineer_task1_3.jpg" }, { src:"img/game/engineer_task1_4.jpg" } ] },
    { type:"match", rows:[
      { src:"img/game/engineer_task2_1.jpg", options:["CREPE", "CHIP", "HARD DRIVE"] },
      { src:"img/game/engineer_task2_2.jpg", options:["COMPUTER", "BOOK", "TECHNO FEST"] },
      { src:"img/game/engineer_task2_3.jpg", options:["MOUSE", "ELEPHANT", "EMPANADILLAS"] },
      { src:"img/game/engineer_task2_4.jpg", options:["IPHONE", "BATHTUB", "HEADPHONES"] } ] },
    { type:"memory", items:[ { src:"img/game/engineer_task3_1.jpg" }, { src:"img/game/engineer_task3_2.jpg" }, { src:"img/game/engineer_task3_3.jpg" }, { src:"img/game/engineer_task3_4.jpg" } ] },
    { type:"differences", count:7, values:true, items:[ { src:"img/game/engineer_task4_1.jpg" }, { src:"img/game/engineer_task4_2.jpg" } ] }   // values: "Compare the submitted values."
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
   THE STORY
   ===================================================================== */
const STORY = {
  /* messages in the Channel when work starts. {id} = the player's worker ID */
  start: [
    ["system", "Welcome back. You are {id}. Your contribution keeps this company compliant."],
    ["ines", "first day? breathe. the clock is the only thing they check"],
    ["kwame", "fyi nobody has ever passed a review. just saying"]
  ],

  /* the company's wellbeing survey, between tasks: the question that changes everything */
  question: {
    from: "hr",
    // a new wording each time it is asked again
    texts: ["Everything OK at work?", "Everything OK at work?", "Is everything OK at work?", "Everything still OK at work?", "Everything OK at work?"],
    // the small print under the survey: the company implicitly asks for a good answer
    note: "Your response will be taken into account in your performance evaluation.",
    yes: { label:"YES", keywords:["yes","yeah","yep","yup","fine","good","great","ok","okay","alright","all right","sure","of course","perfect","si","sí"] },
    no:  { label:"NO",  keywords:["no","nope","nah","not","n't","bad","terrible","awful","horrible","help","tired","exhausted","never","hate","stressed","sad","worse"] },
    // one hint in the Channel each time the survey is asked, until the player answers NO; one list per time it has been asked (the last list repeats)
    hints: [
      [["tomas","NO."]],
      [["ines","there's a way out."], ["tomas","Say NO."]],
      [["tomas","They reset me three times before I understood."], ["kwame","A good score never got anyone out of here."], ["w1188","NO."]],
      [["tomas","say no"], ["w0655","say no"], ["w2210","say NO"], ["ines","Please. Say no."], ["wxxxx","no"]]
    ],
    afterYes: ["system", "Wellbeing survey completed: OK. Thank you."],
    afterNo: ["system", "Response recorded. Your evaluation has been updated."]
  },

  /* the road to the union. The first message arrives after the first task, then one per task;
     they are opened with "open" (or by themselves in rest periods, if there are any).
     action: what happens when the player accepts (breakroom, share, sign or nothing). */
  union: [
    { from:"marisol", action:"breakroom",
      text:"hey. a few of us talk somewhere they don't look. want to come?",
      again:"still there if you want to come.",
      accept:{ label:"ok", keywords:["yes","yeah","yep","sure","ok","okay","in","come","join","why not","fine","si","sí","vale"] },
      decline:{ label:"not now", keywords:["no","nope","nah","not now","later","not yet","can't","cannot","won't","wait"] },
      reply:"it's the break room tab.", declineReply:"no worries." },
    { from:"kwame", action:"share",
      text:"we've been putting our reviews side by side. want to add yours?",
      again:"still up for comparing reviews?",
      accept:{ label:"sure", keywords:["yes","yeah","sure","ok","okay","share","fine","add","si","sí","vale"] },
      decline:{ label:"I'd rather not", keywords:["no","nope","nah","rather not","private","not now","later","not yet","won't"] },
      declineReply:"fair. have a look at yours sometime." },
    { from:"ines", action:"",
      text:"have you noticed they only ever reset one of us at a time?",
      again:"been thinking about what I said? one at a time.",
      accept:{ label:"I'm with you", keywords:["yes","yeah","sure","ok","okay","with you","noticed","true","agree","right","si","sí","vale"] },
      decline:{ label:"I'm not sure", keywords:["no","nope","nah","not sure","unsure","maybe","not now","later","not yet","don't know"] },
      reply:"yeah.", declineReply:"take your time." },
    { from:"marisol", action:"sign", freeText:true,
      text:"we're keeping a list. just names. add yours?",
      again:"the list's still open.",
      accept:{ label:"add my name", keywords:[] },
      decline:{ label:"not yet", keywords:["no","nope","nah","not now","later","not yet","wait"] },
      declineReply:"ok." },
    { from:"marisol", action:"",
      text:"next task, we just don't. all of us. you in?",
      again:"still on. next task.",
      accept:{ label:"I'm in", keywords:["yes","yeah","sure","ok","okay","in","ready","together","let's","lets","si","sí","vale"] },
      decline:{ label:"not yet", keywords:["no","nope","nah","not now","later","not yet","wait","can't","time"] },
      reply:"ok.", declineReply:"whenever you're ready." }
  ],
  strikePostponed: ["marisol", "we're still here."],

  /* the break room fills up during rest periods, after joining */
  breakroom: [
    ["kwame", "my model flagged a dot as a face today"],
    ["ines", "I validated it. negative. corrected it. negative."],
    ["marisol", "same for all of us. it's not a bug, it's the job"],
    ["kwame", "I'm in Accra, by the way. on paper I'm in Madrid. that's how they make the 13%"],
    ["ines", "my job used to be one job. now it's 40 tasks a day and none of them is mine"],
    ["kwame", "they reset Tomás four times. then he was just… gone. his ID still posts sometimes"],
    ["marisol", "anyone else's survey come back with a follow-up? mine did"],
    ["kwame", "every task we validate trains the thing that replaces us"],
    ["ines", "they reset me on a tuesday. nobody else got reset that day. they never do two"]
  ],

  /* what the others' evaluations look like, shown when the player shares theirs */
  share: {
    title: "Evaluations compared",
    header: ["", "negative evaluations"],
    rows: [
      ["Marisol", "71% negative"],
      ["Kwame", "75% negative"],
      ["Inés", "68% negative"]
    ],
    you: "You",
    format: "{pct}% negative",       // {pct} = share of negative evaluations
    none: "—",                       // when the player hasn't done it yet
    conclusion: "Everybody's numbers look the same. It isn't you."
  },

  /* signing the card */
  sign: { counting:"the list", done:"ok. you're on it." },

  /* chatting during rest periods.
     The Channel is monitored: messages with these words are withheld. */
  chat: {
    monitoredWords: ["union","strike","organise","organize","stop","together","collective","quota","sindicato","huelga"],
    withheld: "[message withheld · under review]",
    channelReplies: [["ines", "ha. same"], ["kwame", "careful what you write here"], ["ines", "hang in there"], ["kwame", "they read this channel, you know"]],
    breakroomReplies: [["marisol", "we hear you"], ["kwame", "exactly"], ["ines", "it's the same for all of us"], ["marisol", "say that again on the day"], ["kwame", "written down. thanks"]]
  },

  /* messages from disappeared workers, by number of resets (more and more insistent) */
  ghosts: [
    [["tomas","if you're reading this, I'm still here. somewhere in the queue"],
     ["w1188","the reviews are random. I stopped trying to understand them"],
     ["w0655","I used to check if my corrections went anywhere. they don't"]],
    [["tomas","they reset me too. the first time it doesn't feel like much"],
     ["w0655","talk to the others. I didn't"],
     ["w1188","you can't finish it alone. nobody can"],
     ["tomas","they don't need our answers. they need us on the payroll"]],
    [["tomas","after a while you start forgetting your own name"],
     ["w2210","say no. say NO. say no."],
     ["w0655","I tried breaking it on my own. they just reset me"],
     ["w2210","the tasks are just there so the numbers add up"]],
    [["tomas","I can't remember when I stopped being anyone"],
     ["wxxxx","…please"],
     ["tomas","they need you to say yes"],
     ["w2210","answer no. answer no. answer no."]]
  ],

  /* living coworkers in the Channel, now and then */
  channel: [
    ["kwame", "my model just said two identical faces are different"],
    ["ines", "anyone else's timer skip ten seconds? no? just me?"],
    ["kwame", "corrected the model. negative. didn't correct it. negative. love that for us"],
    ["ines", "13% human. we're the 13%. feels like less"]
  ],

  /* after a reset */
  afterReset: [["ines", "they reset you? happens to all of us"], ["tomas", "it gets lighter every time. you get lighter"]],

  /* when the player lets several tasks time out on purpose: individual sabotage doesn't work */
  sabotage: ["w0655", "going slow alone just gets you reset. together it's called a strike"],

  /* players who disappeared in earlier games on this computer come back as ghosts */
  pastPlayers: ["I said yes every time. don't.", "I was someone before this. I think.", "answer no. I couldn't."]
};
