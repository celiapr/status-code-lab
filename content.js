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
  // what comes after each task of a round ("rest" or "survey"); its length is the number of tasks per round.
  // At the end of the round comes the review: the only evaluation the worker ever sees.
  ROUND: ["rest", "survey", "rest", "survey"],
  REVIEW_FAIL: 0,              // negative evaluations in a round that make the review fail (and reset the round); 0 = it always fails
  // presence (how visible the screen is) at the start and after each reset;
  // failing a review after the last value means disappearing (WORKER NOT FOUND)
  PRESENCE: [1, 0.75, 0.40, 0.10],
  SCREEN_FADE: 0.6,            // how much the whole screen fades as presence drops (0 = not at all, 1 = completely)
  OTHER_SPECIALTY_CHANCE: 0.25,// chance of getting a task from another worker's specialisation
  SUBMIT_PAUSE: 900,           // milliseconds before the next step after submitting a task

  // mandatory rest period: no work allowed. Messages and chat are always there,
  // but only now is there time to read them: pending messages open by themselves.
  BREAK_SECONDS: 30,           // length of the rest period

  // how the Model behaves (it is often wrong, on purpose)
  MODEL: {
    odd: 0.5,                  // chance it marks the right element
    detect: 0.55,              // chance it detects each real difference
    falsePositives: [1, 3],    // differences it invents (min, max)
    captchaTile: 0.78,         // chance it gets each CAPTCHA tile right
    matchRow: 0.6,             // chance each pair is right
    classifyItem: 0.6          // chance each label is right
  },

  // the rigged evaluation: chance of a NEGATIVE evaluation in each case
  NEGATIVE: {
    timeout: 1,                // ran out of time
    validatedRight: 0.15,      // validated the Model, and the Model was right
    validatedWrong: 0.8,       // validated the Model, and the Model was wrong
    correctedRight: 0.55,      // corrected the Model, and the correction was right
    correctedWrong: 0.9,       // corrected the Model, and the correction was wrong
    risePerTask: 0.04,         // grows with each task in the round…
    risePerReset: 0.05,        // …and with each reset
    unionRelief: 0.08,         // goes down with each union step accepted: sharing information helps you hold on
    max: 0.95
  },

  GHOST_MESSAGE_CHANCE: [0.25, 0.45, 0.65, 0.9] // chance of a message from a disappeared worker after each task (from the first survey on), by resets
};
/* Testing: add ?seconds=10 to the address for 10 seconds per task,
   and ?fast to shorten every pause and rest period. Example: index.html?seconds=10&fast */

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
  // the login page. The context of the story is told only in the small print (the footnote).
  login: {
    welcome: "Welcome to",
    title: "HVL",
    subtitle: "Human Validation Layer",
    name: "Name",
    placeholder: "your name",
    button: "Log in",
    footnote: [
      "Under the <b>Minimum Human Quota Act</b>, every company must keep at least <b>13% human workers</b>, of flesh and blood, on its staff.",
      "Through the Human Validation Layer, human workers validate, supervise and sign off what automated systems produce, so that every decision has a responsible human behind it.",
      // "Nobody trusts their judgement. Nobody gives them authority over the automated processes. They are needed to comply with the law, and not needed for the system to work.",
      // "Madrid, 2030."
    ]
  },
  select: {
    label: "Applicant profiles",
    human: "Please show that you are human.",
    pick: "Select your profile.",
    // the human verification: two things no machine will ever share with us
    captcha: {
      prompt: "Select everything that gets tired.",
      verify: "Verify",
      retry: "Please try again.",
      statement: "I will die.",          // the small box underneath, like "I accept the terms"
      done: "Verified: human.",
      continue: "Continue"
    },
    assigned: "Specialisation"
  },
  onboarding: {
    label: "Profile accepted",
    rules: [
      "You will receive validation tasks generated by <b>the Model</b>. Its answer is already filled in.",
      "If the Model is right, <b>validate</b> it. If it is wrong, <b>correct</b> it.",
      "You have <b>{seconds} seconds</b> per task.",
      "Each round has <b>{tasks} tasks</b>. Your work is reviewed at the end of the round.",
      "Rest periods and wellbeing surveys are mandatory. Work is not available during them.",
      "Final responsibility for every validation lies with the human worker."
    ],
    button: "Start work"
  },
  compliance: { ok:"Human quota 13% · COMPLIANT", fail:"Human quota 0% · NON-COMPLIANT" },
  panels: { chain:"Round {n}", chainOf:"Task {n} of {total}",
            resets:"Resets remaining", channel:"Channel", breakroom:"Break room", sound:"sound on", soundOff:"sound off" },
  task: {
    of: "Task {n} of {total}",
    validate: "Validate model output",
    correct: "Submit correction",
    submitted: "Submitted for review",
    undo: "Undo my changes",
    legendModel: "Model output",
    legendYou: "Your answer",
    reassigned: "Reassigned from another specialisation:",
    reference: "Reference",
    submitted: "Submitted · click a character to mark it",
    approve: "Approve",
    reject: "Reject",
    confidence: "confidence"
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
    failedBody: "Your progress has been reset to task 1.",
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

/* ---------------- HUMAN VERIFICATION IMAGES ----------------
   tired:true = the right answers for "Select everything that gets tired." */
const HUMAN_CHECK = [
  { name:"hand", tired:true, art:String.raw`
         #*=  ##+
   #*=   ##=  ##=   %#
    *+-  ##+- ##=   %+-
    **+  *#+- #*=  %*-
     **+  #*- %*- %#=
      **=*#*=#%*-%%+-
      +***%#**#*+#*=
%#+    ****#******+-
+++++  %%####****++=
  =+++*%%*=+***+=-+=-
   -=+********++++==-
     =+**++*+++++==--
       ===+++++===--
         -=====----
           -----
` },
  { name:"eye", tired:true, art:String.raw`
             ..
     ..................
  %%%%%%%%#=----=#%%%%##**
 %%%%%%%%#--::::--*#####**+
#%%%%%%##+--....--+*****++=-
 ********+--::::--+++++===-
  ====++++=------=====----
     ..................
             ..
` },
  { name:"foot", tired:true, art:String.raw`
 ####*=-
 ####*=-
 ####*=-
 ####*=-
 ####*=-
 ####*=-
 #%%#*+-
 #%%%*+=-
#%%%%#*+==
*%%%#**+++++*#***
*##**++==+++*********#*
 +++==----==++++++++++=
  --------------------
                   :
` },
  { name:"heart", tired:true, art:String.raw`
     +++===-    +++===-
   =++++++====+++++++==-:
  ++++++++===+++++++====--
-++++++===============-----:
 -==================------:
  -=====----======------::
   :-=-----===---------:.
     .:========------:.
       -===========-:
         =========-
           ======
            ====
` },
  { name:"bulb", art:String.raw`
       ##
   %%%%%%%#*+
  %%%%%%%%#**=
 %%%%%%%%##*+=-
#%%%%%%%##**+=--
*#######**++=---
 *******++==---
  ++++++===---
   =++++==---
    +*#**+=-
     :::::..
     :::::..
     ====-::
      .-:.
` },
  { name:"clock", art:String.raw`
       =+===*+++====-
     ==++####++####+=--
   =++*#+=###==###=+#*=-:
  ==*########==########*-:
 ==*#=+######==######+=#*-:
 =+##########==##########+-
==*##########==##########*-:
==##.########=.===#####.##-:
-=*#############+===#####*-:
 -+######################+:
 --*#=+##############+=#*-:
  --*##################*-:
   :-=*#+=###++###=+#*=::
     :-=+*###++###*+=:.
       :::--=++=-::::
` },
  { name:"gear", art:String.raw`
         ==
       ====-   -==
       -============
  ================-
 ===================
  -========--==========-
   =======-:::-=========
==========    =======-:
--===================
----:==================
    -:-================
     -====-=====--::::
    :::-=-:::====
      :::    :----
             :.
` },
  { name:"calculator", art:String.raw`
 +==============
=+=************=:
=+=@@@@@@@@@@@@=-
=+=@@@@@@@@@@@@=-
 +===============
 ===============-
 %+=%%==%%==%%==%
 =+=============-
 %+=%%==%%==%%==%
 =+==============
 %+=%%==%%==%%==%
 =+==============:
 %+=%%==%%==%%==%%
 =+==============-
  -::::::::::::::
` },
  { name:"robot", art:String.raw`
         ==-
         -::
          =:
    *++++++=++++++++
 +++*===============-
 +++*=-:======:-====-
 ==+*....====....===-
---+*=...====...-===--
-::+*+==============-:
 +++*+==-====-=======
 +++*+==-====-=======
 ====----------------
  :::::::::::::::
` },
];

/* =====================================================================
   ASCII IMAGES FOR THE TASKS
   ===================================================================== */

/* FACES (the Actor): built from hair + brows + eyes + mouth.
   brows and eyes: 2 characters (left, right); mouth: 3 characters. */
const FACES = {
  hair: [" .-----. ", " .^^^^^. ", " .~~~~~. ", " .=====. "],
  expressions: {
    joy:       { brows:"  ", eyes:"^^", mouth:"\\_/" },
    sadness:   { brows:"/\\", eyes:"oo", mouth:"/^\\" },
    anger:     { brows:"\\/", eyes:"oo", mouth:"===" },
    surprise:  { brows:"''", eyes:"OO", mouth:" O " },
    fear:      { brows:"/\\", eyes:"00", mouth:"~~~" },
    tiredness: { brows:"  ", eyes:"--", mouth:" o " },
    calm:      { brows:"--", eyes:"oo", mouth:"---" },
    doubt:     { brows:"-/", eyes:"oo", mouth:" ~-" }
  }
};

/* BODIES (the Actor): stick figures in different postures */
const POSTURES = {
  "standing":   String.raw`
  o
 /|\
  |
 / \
`,
  "arms up":    String.raw`
 \o/
  |
  |
 / \
`,
  "waving":     String.raw`
  o/
 /|
  |
 / \
`,
  "walking":    String.raw`
  o
 /|\
  /\
 /  |`,
  "sitting":    String.raw`
  o
 /|\
  |__
     |`,
  "kneeling":   String.raw`
  o
 /|\
  |\
  |_\
`,
  "lying down": String.raw`



o-|-<`,
  "bowing":     String.raw`

 o__
    |
   / \
`
};

/* FOOD (the Cook). group, flavour and gluten are used by the tasks. */
const FOOD = [
  { name:"apple", group:"FRUIT", flavour:"SWEET", art:String.raw`
    ,
  .-|-.
 /     \
 \     /
  '-.-'` },
  { name:"pear", group:"FRUIT", flavour:"SWEET", art:String.raw`
    |
   .'.
  /   \
 (     )
  '---'` },
  { name:"banana", group:"FRUIT", flavour:"SWEET", art:String.raw`
      _
     //
    //
 __//
 \__/` },
  { name:"lemon", group:"FRUIT", flavour:"SOUR", art:String.raw`

  .---.
 <     >
  '---'` },
  { name:"grapes", group:"FRUIT", flavour:"SWEET", art:String.raw`
    \_
   ooo
  oooo
   oo
    o` },
  { name:"cherries", group:"FRUIT", flavour:"SWEET", art:String.raw`
    __
   /  \
  /    \
 o      o` },
  { name:"watermelon", group:"FRUIT", flavour:"SWEET", art:String.raw`

\'.'.'.'/
 \. . ./
  '---'` },
  { name:"carrot", group:"VEGETABLE", flavour:"SWEET", art:String.raw`
  \\|//
   \=/
   |=|
    V` },
  { name:"onion", group:"VEGETABLE", art:String.raw`
   \|/
  (   )
 (  :  )
 (  :  )
  '---'` },
  { name:"mushroom", group:"VEGETABLE", art:String.raw`
  .---.
 / o o \
'-------'
   | |
   |_|` },
  { name:"broccoli", group:"VEGETABLE", flavour:"BITTER", art:String.raw`
  _(@)_
 (@@@@@)
  \(@)/
    |
   _|_` },
  { name:"chilli", group:"VEGETABLE", flavour:"SPICY", art:String.raw`
       ,
    __/
 .-'  )
(__.-'` },
  { name:"fish", group:"PROTEIN", flavour:"SALTY", art:String.raw`

 ><(((('>` },
  { name:"chicken", group:"PROTEIN", flavour:"SALTY", art:String.raw`
  .---.
 (     )
  '._.'
    ||
    oo` },
  { name:"egg", group:"PROTEIN", art:String.raw`
   .-.
  /   \
 |     |
  \___/` },
  { name:"cheese", group:"DAIRY", flavour:"SALTY", art:String.raw`
   _____
  / o  o|
 /____o_|
 | o   o|
 |______|` },
  { name:"milk", group:"DAIRY", art:String.raw`
   ___
  |   |
 /MILK \
 |     |
 '-----'` },
  { name:"bread", group:"GRAIN", gluten:true, art:String.raw`
  _____
 /     \
| ~~~~~ |
|       |
'-------'` },
  { name:"rice", group:"GRAIN", art:String.raw`
  .:::.
 _:::::_
 \     /
  \___/` },
  { name:"pizza", group:"GRAIN", flavour:"SALTY", gluten:true, art:String.raw`
 _______
 \o . o/
  \ o /
   \ /
    V` },
  { name:"cake", group:"SWEET", flavour:"SWEET", gluten:true, art:String.raw`
   i i
  |~~~|
 |-----|
 |_____|` },
  { name:"cookie", group:"SWEET", flavour:"SWEET", gluten:true, art:String.raw`
  .---.
 / o  .\
| .  o  |
 \ o . /
  '---'` },
  { name:"ice cream", group:"SWEET", flavour:"SWEET", art:String.raw`
   .-.
  (   )
   \ /
    V` },
  { name:"honey", group:"SWEET", flavour:"SWEET", art:String.raw`
   ___
  |___|
 /HONEY\
 |_____|` },
  { name:"coffee", group:"DRINK", flavour:"BITTER", art:String.raw`
   ) )
  .___.
  |   |]
  \___/` },
  { name:"fries", group:"VEGETABLE", flavour:"SALTY", art:String.raw`
  ||||
 \||||/
  \  /
   \/` }
];

/* CODE (the Software Engineer): short snippets */
const CODE = [
String.raw`
if (staff < 0.13) {
  hire(human);
}`,
String.raw`
for task in queue:
    validate(task)`,
String.raw`
while (true) {
  work();
}`,
String.raw`
def quota(staff):
    return 0.13`,
String.raw`
human = model.approve()
assert human`,
String.raw`
let x = 0x1F;
x |= 1 << 3;`,
String.raw`
SELECT * FROM workers
WHERE human = 1;`,
String.raw`
try:
    resist()
except Reset:
    pass`
];

/* ---------------- TASK TEXTS ---------------- */
const TASK_TEXT = {
  odd:         { title:"Identify the different element",
                 instruction:"One element in the grid is different from the others. The Model has marked the one it detected. Validate it, or select the right one." },
  differences: { title:"Find the differences",
                 instruction:"Compare the submitted image with the reference. The Model has marked the differences it found. Click characters to add or remove marks." },
  captcha:     { title:"CAPTCHA verification",
                 instruction:"Select every tile that matches. The Model has pre-selected its answer.",
                 robot:"[x] I'm not a robot · verified by the Model" },
  match:       { title:"Match the images",
                 instruction:"The Model has paired each element on the left with one option. Click an option to change a pair." },
  classify:    { title:"Validate classifications",
                 instruction:"The Model has labelled each element. Approve or reject each label." }
};

/* ---------------- WHAT EACH WORKER IS GIVEN ----------------
   pool: where the images come from — "faces", "postures", "food" or "code".
   match (captcha): which items count as a "yes", by a property (name, group, gluten…).
   by (match / classify): the property used as the pair or the label.
   Text-only tasks (the engineer) list their items directly. */
const WORK = {
  actor: {
    odd: ["faces", "postures"],
    differences: [ { rows:[["faces", 4], ["postures", 6]] } ],
    captcha: [
      { prompt:"Select all faces showing joy", pool:"faces", match:{ name:["joy"] } },
      { prompt:"Select all faces showing sadness", pool:"faces", match:{ name:["sadness"] } },
      { prompt:"Select all faces showing anger", pool:"faces", match:{ name:["anger"] } },
      { prompt:"Select all faces showing surprise", pool:"faces", match:{ name:["surprise"] } },
      { prompt:"Select all people who are not standing", pool:"postures", match:{ name:["sitting", "kneeling", "lying down", "bowing"] } }
    ],
    match: [
      { prompt:"Match each face with its emotion", pool:"faces", by:"name" },
      { prompt:"Match each body with its posture", pool:"postures", by:"name" }
    ],
    classify: [
      { prompt:"Validate the Model's emotion labels", pool:"faces", by:"name",
        labels:["JOY","SADNESS","ANGER","SURPRISE","FEAR","TIREDNESS","CALM","DOUBT"] },
      { prompt:"Validate the Model's posture labels", pool:"postures", by:"name",
        labels:["STANDING","ARMS UP","WAVING","WALKING","SITTING","KNEELING","LYING DOWN","BOWING"] }
    ]
  },

  engineer: {
    odd: ["code"],
    differences: [ { stack:["code", 3] } ],
    captcha: [
      { prompt:"Select all prime numbers", yes:["2","3","5","7","11","13","17","19","23","29","31"], no:["1","4","6","8","9","10","12","15","21","25","27","33","39"] },
      { prompt:"Select all even numbers", yes:["2","8","14","26","40","58","96","112"], no:["3","7","13","21","35","49","77","101","9"] },
      { prompt:"Select all valid hexadecimal values", yes:["0x1F","0xA0","0xFF","0x13","0xBEEF","0x7C"], no:["0xG1","0x1Z","0xHI","0xQ7","0xPP","0xZZ","0x1K"] },
      { prompt:"Select all palindromes", yes:["1221","level","10101","noon","stats","racecar"], no:["1231","parser","model","10110","night","state","token"] },
      { prompt:"Select all balanced brackets", yes:["()","[]","{()}","([])","(()())"], no:["(]","{)","(()","[)]",")(","{[}]","(("] }
    ],
    match: [
      { prompt:"Match each decimal number with its binary form",
        pairs:[["2","10"],["3","11"],["5","101"],["6","110"],["7","111"],["9","1001"],["12","1100"],["13","1101"]] },
      { prompt:"Match each opening token with its closing token",
        pairs:[["(",")"],["[","]"],["{","}"],["<",">"],["/*","*/"],["<!--","-->"]] },
      { prompt:"Match each operator with its meaning",
        pairs:[["==","equals"],["!=","not equal"],["&&","and"],["||","or"],["<=","at most"],[">=","at least"]] }
    ],
    classify: [
      { prompt:"Validate the Model's prime number detection", labels:["PRIME","NOT PRIME"],
        items:[["17","PRIME"],["13","PRIME"],["31","PRIME"],["2","PRIME"],["21","NOT PRIME"],["9","NOT PRIME"],["1","NOT PRIME"],["51","NOT PRIME"],["91","NOT PRIME"]] },
      { prompt:"Validate the Model's type detection", labels:["INTEGER","STRING","BOOLEAN","LIST","NULL"],
        items:[["42","INTEGER"],["\"42\"","STRING"],["true","BOOLEAN"],["[1, 2]","LIST"],["null","NULL"],["\"false\"","STRING"],["0","INTEGER"],["[]","LIST"]] }
    ]
  },

  cook: {
    odd: ["food"],
    differences: [ { rows:[["food", 4], ["food", 4]] } ],
    captcha: [
      { prompt:"Select all fruit", pool:"food", match:{ group:["FRUIT"] } },
      { prompt:"Select all vegetables", pool:"food", match:{ group:["VEGETABLE"] } },
      { prompt:"Select all sweets", pool:"food", match:{ group:["SWEET"] } },
      { prompt:"Select all items that contain gluten", pool:"food", match:{ gluten:[true] } }
    ],
    match: [
      { prompt:"Match each food with its name", pool:"food", by:"name" }
    ],
    classify: [
      { prompt:"Validate the Model's food groups", pool:"food", by:"group",
        labels:["FRUIT","VEGETABLE","PROTEIN","DAIRY","GRAIN","SWEET","DRINK"] },
      { prompt:"Validate the Model's flavour labels", pool:"food", by:"flavour",
        labels:["SWEET","SOUR","SALTY","BITTER","SPICY"] }
    ]
  }
};

/* ---------------- EVALUATION REASONS ----------------
   One is picked at random. The case names match CONFIG.NEGATIVE. */
const REASONS = {
  positive:       ["Output accepted.", "Within tolerance.", "Accepted. Validation logged."],
  timeout:        ["Latency above benchmark.", "Task abandoned: time limit exceeded."],
  validatedRight: ["Validation time above benchmark.", "Insufficient engagement signal.", "Output indistinguishable from automated validation."],
  validatedWrong: ["Failure to flag model error.", "Anomaly approved without review.", "Assessor endorsed incorrect output."],
  correctedRight: ["Deviation from model output.", "Override not supported by reference data.", "Correction conflicts with model confidence."],
  correctedWrong: ["Deviation from model output.", "Unjustified override.", "Assessor introduced an error."]
};

/* =====================================================================
   THE STORY
   ===================================================================== */
const STORY = {
  /* messages in the Channel when work starts. {id} = the player's worker ID */
  start: [
    ["system", "Welcome back, {name}. You are {id}. Your contribution keeps this company compliant."],
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

  /* the road to the union, after answering NO in the survey. One message per task;
     they open by themselves during rest periods, or with "open" at any time.
     action: what happens when the player accepts (breakroom, share, sign or nothing). */
  union: [
    { from:"marisol", action:"breakroom",
      text:"hey. saw your answer to the survey. a few of us talk during the breaks, somewhere they don't look. want to come?",
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
    header: ["", "when validating", "when correcting"],
    rows: [
      ["Marisol", "71% negative", "67% negative"],
      ["Kwame", "75% negative", "68% negative"],
      ["Inés", "68% negative", "72% negative"]
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
