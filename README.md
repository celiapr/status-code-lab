# Minimum Human Quota

Madrid, 2030. After the strikes against automation, a law forces every company to keep at least 13% human workers. Displaced professionals are rehired to validate what the machines produce, with no power to question it. Their old jobs have been broken into small tasks. The player is one of them, and can't get out alone: the only way out is to organise with the other workers.

Developed within the Medialab Matadero residency "LAB 5 La mecánica de la verdad".

This is the **demo version**: fixed tasks with photographs, one round per profile, and the path to WORKER NOT FOUND. The version before it (ASCII tasks, the Model, rest periods and surveys) is backed up in `../platform-13-backup-2026-11-23` and tagged `before-demo` in git.

**Screen flow:** a map of every screen, with screenshots, is at https://claude.ai/artifact/1PhHE5PMkwVCSdB5Kwz8Ff (only people it has been shared with can open it).

## Run it
Online: **https://celiapr.github.io/status-code-lab/** (published with GitHub Pages from the repository `celiapr/status-code-lab`; every change pushed to `main` goes live in a minute or two).

On a computer: double-click `index.html`. It opens in the browser; no installation or internet needed.

Testing (add to the end of the address):
- `?seconds=10` gives 10 seconds per task instead of 60.
- `?fast` shortens every pause (and the memory grid's viewing time).
- Both: `index.html?seconds=10&fast`

## Files
| File | What it is |
|---|---|
| `content.js` | **Everything to edit**: settings, texts, profiles, the verification images, the demo tasks, the story, endings |
| `game.js` | Screens, the rounds (one per profile), the review, resets, the strike, endings |
| `tasks.js` | The four kinds of task |
| `story.js` | Messages from the coworkers, the union steps, the chat |
| `sound.js` | Small sounds made by the browser |
| `style.css` | Look and layout (white on black, monospace) |
| `fonts/` | The game's font, IBM Plex Mono (free, OFL licence in `fonts/OFL.txt`). It travels with the game, so it looks the same on every computer, with no internet |
| `img/` | The team's original images, used by the game exactly as they are (`worker1_…` = the Actor, `worker2_…` = the Cook), and the design PDF (`demo_gameover.pdf`) |
| `img/game/` | The Software Engineer's images, made from text for now |
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
   The Software Engineer's images are made of text (binary blocks, drawings in characters, code and formulas), in the same style: `img/game/engineer_…`.
6. **The arrow** (bottom left of each task) skips the task, like a one-person strike. It is always there, but it only works once the worker has accepted a message from a coworker; with the chats off, it stays disabled.
7. **The review** at the end of the round always fails: "REVIEW FAILED · Please start again.", with the resets remaining. Then "Choose your next profile.": the profiles already used are greyed out.
8. **Disappearing.** One round per profile: 3 profiles, 3 rounds. With each failed review the whole screen (reviews included) sinks further into black. After the third, only "REVIEW FAILED" is shown, everything goes black, and **WORKER NOT FOUND** comes out of the black. The previous fading (towards white) is kept commented out in `style.css` and `game.js`.
9. **Messages and chat are switched off for the demo** (`CONFIG.CHATS = false`: no right column, no coworker messages, so the arrow, the strike and Ending B can't be reached). With `CONFIG.CHATS = true` they come back as before (they are still being rewritten): the Channel, the Break room once you join, the chat box, and direct messages ("New message from… · open"). Now the first coworker message arrives after the first task, with no survey before it. Turning a message down has a quiet cost: the Break room goes silent and nobody covers for the worker until they accept again; the message comes back two tasks later. Once the worker has joined, a failed review no longer costs a reset ("We covered for you.").
10. **The strike and Ending B** are unchanged: after the last coworker message, STOP WORKING → TERMINATION OF EMPLOYMENT → SYSTEM FAILURE → YOU WON!

Rest periods and surveys are switched off. To bring them back, write `"rest"` or `"survey"` in `CONFIG.ROUND`.

Players who disappear are remembered on that computer: in later games their ID shows up in the Channel as a disappeared worker.

## Editing
Everything is in `content.js`, with comments:
- `CONFIG`: task time, the shape of a round, the presence (fading) of each round, the memory grid's viewing time, how rigged the evaluation is.
- `WORKERS`: the three profiles (name, quote, specialisation).
- `TEXT`: every interface text: approval page (`TEXT.login`), terms (`TEXT.terms`), verification and profile screens (`TEXT.select`), "Hello, Worker" (`TEXT.onboarding`), the review, disappearance, strike, the three ending screens.
- `VERIFY`: the photos of "Select those who cannot dream" and which ones must be selected.
- `DEMO`: the 4 tasks of each profile (images, names, how many differences). `DEMO_TEXT`: their titles and instructions.
- `PEOPLE` and `STORY`: the other workers and their messages.

To add or change an image: put it in `img/` and write its path in `content.js`.

`tools/make_images.py` belongs to the previous version (it drew the ASCII verification images); the demo doesn't use it.

## Limits
- Typed answers are understood by keyword lists (in English, plus a few Spanish words), not by real language understanding.
- It's single-player: the other workers are written characters, and their chat replies are prewritten.

## Future additions
- Use the Gen Z slang dataset (https://huggingface.co/datasets/MLBtrio/genz-slang-dataset) to generate the coworkers' texts.
