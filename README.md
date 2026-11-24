# Minimum Human Quota

Madrid, 2030. After the strikes against automation, a law forces every company to keep at least 13% human workers. Displaced professionals are rehired to validate what the machines produce, with no power to question it. Their old jobs have been broken into small tasks. The player is one of them, and can't get out alone: the only way out is to organise with the other workers.

Developed within the Medialab Matadero residency "LAB 5 La mecánica de la verdad".

This is the **demo version**: fixed tasks with photographs, one round per profile, the other workers' messages as popups, and two endings: WORKER NOT FOUND (alone) or YOU WON! (together). The version before it (ASCII tasks, the Model, rest periods and surveys) is backed up in `../platform-13-backup-2026-11-23` and tagged `before-demo` in git.

**Screen flow:** a map of every screen, with screenshots, is at https://claude.ai/artifact/1PhHE5PMkwVCSdB5Kwz8Ff (only people it has been shared with can open it).

## Run it
Online: **https://celiapr.github.io/status-code-lab/** (published with GitHub Pages from the repository `celiapr/status-code-lab`; every change pushed to `main` goes live in a minute or two). After changing any file, raise the number in `?v=10` in `index.html` (to `?v=11`, and so on), so browsers that already opened the game load the new version instead of the one they remember.

On a computer: double-click `index.html`. It opens in the browser; no installation or internet needed.

Testing (add to the end of the address):
- `?seconds=10` gives 10 seconds per task instead of 60.
- `?fast` shortens every pause (and the memory grid's viewing time, and the time between popups).
- Both: `index.html?seconds=10&fast`

## Files
| File | What it is |
|---|---|
| `content.js` | **Everything to edit**: settings, texts, profiles, the verification images, the demo tasks, the story, endings |
| `game.js` | Screens, the rounds (one per profile), the review, resets, the strike, endings |
| `tasks.js` | The four kinds of task |
| `story.js` | The other workers' messages: the popups, where they go, and what answering (or not) does |
| `sound.js` | Small sounds made by the browser |
| `style.css` | Look and layout (white on black, monospace) |
| `fonts/` | The game's font, IBM Plex Mono (free, OFL licence in `fonts/OFL.txt`). It travels with the game, so it looks the same on every computer, with no internet |
| `img/` | The team's original images, used by the game exactly as they are (`worker1_…` = the Actor, `worker2_…` = the Cook), and the design PDF (`demo_gameover.pdf`) |
| `img/engineer/` | The Software Engineer's photos (the match), used exactly as they are |
| `index.html` | Page structure |

## How it plays
1. **Human verification**, two screens ("Please show that you are human."):
   - "Select those who cannot dream": nine photos. Selected photos darken. Things (the pizza, the computer, the sock) must be selected; people and animals that dream (the singer, the man, the octopus, the dog) must not. Two are open to interpretation and count either way: the scientist who is no longer alive, and the face that may not be human.
   - "Tick all that apply to you as a person": I was born, I think, I experience, I feel, I subjectively perceive, I will age, I will die. All of them.
2. **Approved**: "Human validation complete. You have been approved as a human user." There is no login: the worker only gets an ID.
3. **Terms**: the platform's own words: Human in the Loop, Humans strictly necessary, The function of humans.
4. **Choose a profile**: the Actor, the Software Engineer or the Cook. Then "Hello, Worker.", the rules (the Model evaluates each round; "communication between workers may be monitored"), and START.
5. **The round**: the profile's 4 tasks, always in this order, 60 seconds each:
   1. *Identify the different element*: four images, click one (it darkens).
   2. *Match the images*: four images, three names each; pick one name per image.
   3. *Memory grid*: four images for a few seconds, then they disappear and come back in a column in random order; put them back in their squares (click an image, then a square; or drag it). Click a square to take an image out again.
   4. *Find the differences*: two images; click to mark the 7 differences (click a mark to remove it). The Software Engineer compares two formulas that differ in only one sign, and still has to mark 7.
   A task ends when it is done, or when its time runs out. Nothing tells the worker how it went.
   The Software Engineer, as in the PDF: the different element (binary blocks) and the differences (two formulas) are text; the match uses the team's photos in `img/engineer/`, as in the PDF; the memory grid, which isn't in the PDF, shows four short pieces of code as text until there are images.
6. **Popups.** Two kinds, which look different and appear in different places. Both only move on while a task is on screen (not during reviews or the profile screen).
   - *SYSTEM* (the company): square and white, with the bar "HVL · WELLBEING SURVEY" or "HVL · SYSTEM" on top, always in the bottom right corner, the newest at the bottom. The survey comes after the first minute of work and then every 3 minutes, one question at a time, in turn: "Are you satisfied with your current role?", "Would you recommend this company as a workplace to other humans?", "Is there anything you would like to share with management?". YES / NO; its answers change nothing. Left unanswered until the end of the next task, it goes away.
   - *The workers*: their names are a random two-digit number, new each game (W35, W27…); in `content.js` they are written W1…W7. Their popups are rounded and grey, in the top right corner like a computer's notifications: the newest on top, the earlier ones slide down. From the second task on, one after another:

   1. *W5 writes privately*: "Hey. Everything OK at work?", "Do you feel supported by the people working alongside you?", "Have you ever thought about talking to the others about what's going on?", and if YES, "There's a few of us already talking. Want me to add you?".
   2. *The workers' chat box*: a black box (1000×652, smaller on small screens) opens in the middle of the screen, over the task; the task waits, its clock stopped. The player comes in in the middle of the conversation: the lines come in one after another, some right after the one before or almost at once, and the box scrolls up. They are organising: the collective action is to press the arrow (SKIP) all at the same time, at 12:00 ("a work stoppage at 12:00. all of us. will you?"). After "we need to be a union", SYSTEM, in grey italics: "1 message withheld: contains 'union'". It ends with three "i'm in". Below, "YOU:" and a blinking bar: whatever key the player presses, "i'm in" is typed, letter by letter; one more key (or Enter) sends it ("YOU: i'm in" in the chat), and the box closes. On a touch screen, each tap types.
   3. *12:00*: "12:00. SKIP. now." The arrow lights up (bright even on a darkened screen).
7. **Answering, turning down, ignoring.**
   - Answering W5 brings the player in with the others: the arrow works from then on.
   - Turning them down (YES to "Everything OK at work?"; NO to talking to the others or to being added) or leaving a question unanswered until the end of the next task: the arrow stops working again, no messages for 2 tasks, and then the same message comes back.
   - In the chat box, not writing for 20 seconds closes it: the same as turning them down (the arrow stops working, 2 tasks without messages), and then the whole chat comes back.
   - With only 12 tasks, a player who keeps turning them down runs out of rounds before 12:00.
8. **The arrow** (bottom left of each task) skips the task. It is always there, but it only works while the player is with the others. Skipping alone doesn't save anyone: the review still fails. Pressed at 12:00, it is the strike.
9. **The review** at the end of the round always fails: "REVIEW FAILED · Please start again.", with the resets remaining. Then "Choose your next profile.": the profiles already used are greyed out.
10. **Ending A: disappearing.** One round per profile: 3 profiles, 3 rounds. With each failed review the whole screen (reviews included) sinks further into black; the popups stay sharp. After the third, only "REVIEW FAILED" is shown, everything goes black, and **WORKER NOT FOUND** comes out of the black. The previous fading (towards white) is kept commented out in `style.css` and `game.js`.
11. **Ending B: the strike.** Pressing the arrow at 12:00: the screen lights up again, popups pour in all over the screen ("W35 skipped.", "W12 skipped."…), then SYSTEM, stacked in its corner: "Inactivity detected.", "Active human validators: 0", "Minimum Human Quota: 13% → 0%", "COMPLIANCE STATUS: FAILED", and the header turns NON-COMPLIANT. Then TERMINATION OF EMPLOYMENT → SYSTEM FAILURE → YOU WON!

## Editing
Everything is in `content.js`, with comments:
- `CONFIG`: task time, the presence (fading) of each round, the memory grid's viewing time, how rigged the evaluation is, and the popups' timing (from which task, how many quiet tasks after turning them down, seconds between popups, how long a chat line stays, the chat box's reading time and how long it waits for the player to write, when the survey comes and how often).
- `WORKERS`: the three profiles (name, quote, specialisation).
- `TEXT`: every interface text: approval page (`TEXT.login`), terms (`TEXT.terms`), verification and profile screens (`TEXT.select`), "Hello, Worker" (`TEXT.onboarding`), the review, disappearance, the strike (who skips and the SYSTEM lines), the three ending screens.
- `VERIFY`: the photos of "Select those who cannot dream" and which ones must be selected.
- `DEMO`: the 4 tasks of each profile (images, names, how many differences). `DEMO_TEXT`: their titles and instructions.
- `SURVEY`: the company's survey questions and its replies.
- `MESSAGES`: the workers' messages, in order: W5's popups (who writes, the text, the reply to YES and to NO, and which answers turn them down), then the chat box (its lines, each with its pace: how soon it comes after the one before, and what the player writes), then 12:00.

To add or change an image: put it in `img/` and write its path in `content.js`.

`tools/make_images.py` belongs to the previous version (it drew the ASCII verification images); the demo doesn't use it.

## Limits
- It's single-player: the other workers are written characters, and their messages are prewritten.

## Future additions
- Use the Gen Z slang dataset (https://huggingface.co/datasets/MLBtrio/genz-slang-dataset) to generate the coworkers' texts.
