# Minimum Human Quota

Madrid, 2030. After the strikes against automation, a law forces every company to keep at least 13% human workers. Displaced professionals are rehired to validate what the machines produce, with no power to question it. Their old jobs have been broken into small tasks. The player is one of them, and can't get out alone: the only way out is to organise with the other workers.

Developed within the Medialab Matadero residency "LAB 5 La mecánica de la verdad".

**Screen flow:** a map of every screen, with screenshots, is at https://claude.ai/artifact/1PhHE5PMkwVCSdB5Kwz8Ff (only people it has been shared with can open it).

## Run it
Online: **https://celiapr.github.io/status-code-lab/** (published with GitHub Pages from the repository `celiapr/status-code-lab`; every change pushed to `main` goes live in a minute or two).

On a computer: double-click `index.html`. It opens in the browser; no installation or internet needed.

Testing (add to the end of the address):
- `?seconds=10` gives 10 seconds per task instead of 60.
- `?fast` shortens every pause, and rest periods last 3 seconds.
- Both: `index.html?seconds=10&fast`

## Files
| File | What it is |
|---|---|
| `content.js` | **Everything to edit**: settings, texts, workers, task images, task material, the story, endings |
| `game.js` | Screens, the rounds (tasks, rest periods, surveys, the review), resets, the strike, endings |
| `tasks.js` | The five kinds of task |
| `story.js` | Messages, the "Everything OK at work?" question, the union steps, the chat |
| `sound.js` | Small sounds made by the browser |
| `style.css` | Look and layout (white on black, monospace) |
| `fonts/` | The game's font, IBM Plex Mono (free, OFL licence in `fonts/OFL.txt`). It travels with the game, so it looks the same on every computer, with no internet |
| `index.html` | Page structure |

## How it plays
1. **Human verification** (first screen, "Please show that you are human"): a CAPTCHA, "Select everything that gets tired" (a hand, an eye, a foot and a heart, among machines), and underneath, like "I accept the terms", a box: "[ ] I will die." Both done → "Verified: human." and "Continue".
   **Login**: "Welcome to HVL · Human Validation Layer" and a name to type. The context is only in the small print underneath, in the company's own words: the Minimum Human Quota Act (13% human workers, of flesh and blood) and what human workers do on the platform. Then the **choice of worker**: the Actor (faces and bodies), the Software Engineer (patterns and logic) or the Cook (food). The name appears in the welcome message and on the list.
2. **Work.** Tasks are drawn in ASCII and last 60 seconds each. In every task the Model's answer is already filled in (dashed outline). The player either **validates** it or **corrects** it (inverted, black). After submitting, the button only says "Submitted for review": no result is shown.
   - Five kinds of task: identify the different element, find the differences, CAPTCHA, match the images, validate classifications.
   - Mostly the worker's own specialisation, but sometimes a task "reassigned from another specialisation".
   - The Model is often wrong on purpose: it marks differences that aren't there and misses obvious ones.
3. **The round.** Always the same shape: task → rest → task → survey → task → rest → task → survey → review. The side panel shows the round, the task number and the resets remaining.
4. **Messages and chat are always there**, on the right: the Channel, the Break room once you join, a chat box, and new direct messages ("New message from… · open"). They can be opened at any time, but the task clock keeps running. The Channel is monitored: messages about unions or strikes are withheld.
5. **Mandatory rest period** (after tasks 1 and 3). A 30-second countdown during which work is unavailable. Only now is there time: a waiting message opens by itself. If it's still open when the rest period ends, work resumes behind it ("REST PERIOD OVER · back to work").
6. **The survey** (after tasks 2 and 4). No clock: work resumes once it is answered. The company's **Wellbeing survey** asks **"Everything OK at work?"**, with small print: *"Your response will be taken into account in your performance evaluation."* The company implicitly asks for a good answer.
   - From the first survey on, coworkers and disappeared workers (shown only by their ID: they've lost their name) write in the Channel, more and more often as presence drops. Each time the survey is asked, a hint in the Channel, often from someone who is no longer there, says otherwise ("Answer NO.").
   - The player can click YES / NO or type an answer. Typed answers are read by keywords, and the game says how it understood them. Unclear answers are "normalised" to YES, and so is "back to work": the system reads doubt as compliance.
   - **YES**: the round goes on, and the question comes back in the next survey with another wording.
   - **NO** (the first one): Marisol writes ("hey. saw your answer to the survey…") and the road to the union opens, one message per task: join the break room, compare evaluations (your real numbers next to the others'), notice that only one of you is reset at a time, add your name to the list, and agree to stop together. The survey keeps being asked, but while the worker is with the others, the answers change nothing.
   - **Turning a message down** has a quiet cost: that coworker stops writing, the break room goes silent (nobody answers there), and the others stop covering for the worker. The road only reopens with another NO in a survey, and it picks up at the step that was turned down.
7. **The review** (end of the round): the only evaluation the worker sees. Each of the 4 tasks is listed as POSITIVE or NEGATIVE, with an opaque reason, and "These decisions have been added to the Model's training data." It's rigged: validating a wrong Model gets punished, and so does correcting it; accuracy never decides the result. And it always ends in "REVIEW FAILED", even when tasks come back POSITIVE: back to task 1 and one reset fewer. The work never counts. (`REVIEW_FAIL` in `content.js` can make passing possible: e.g. 2 means it fails only with 2 negatives or more.)
8. **Disappearing.** Each failed review lowers the worker's presence: 100% → 75% → 40% → 10%. The game is white on black; with each failed review the black background gets lighter (grey, then lighter grey), so the white text sinks into it. When the worker disappears the screen turns completely white (how much it lightens at each step is set by `SCREEN_FADE`). The previous fading, a white layer over the screen, is kept commented out in `style.css` and `game.js`. Failing with no resets left → **WORKER NOT FOUND**: the worker becomes a ghost of the system (the platform never says "game over": it isn't a game, it's a workplace).
   - Once you've joined the others, they **cover for you**: a failed review no longer costs presence. Each union step also lowers the chance of negative evaluations a little.
9. **The strike.** After the last union message, a big STOP WORKING button (and a small "keep working"). Reaching it gives the worker their presence back. Everyone stops; the company drops to 0% human and fails the law.
10. **Ending B:** TERMINATION OF EMPLOYMENT → SYSTEM FAILURE → **YOU WON!** ("Congratulations, comrades!", and it rains confetti).

Players who disappear are remembered on that computer: in later games their ID shows up in the Channel as a disappeared worker.

## Editing
Everything is in `content.js`, with comments:
- `CONFIG`: times, the shape of a round (`ROUND`: what comes after each task), how many negatives fail a review, presence values, rest periods, how wrong the Model is, how rigged the evaluation is.
- `WORKERS`: the three profiles (name, quote, specialisation).
- `TEXT`: every interface text: login page and its footnote (`TEXT.login`), onboarding, rest period, survey screen, the review, disappearance, strike, the three ending screens.
- **Human verification:** the texts in `TEXT.select.captcha`, the images in `HUMAN_CHECK` (`tired:true` marks the right answers). These images are modelled in 3D and shaded with characters by `tools/make_images.py`; run `python3 tools/make_images.py` to rebuild them (it rewrites `HUMAN_CHECK`, so hand edits there are lost), or `python3 tools/make_images.py preview` to just look at them. They are shaded for a dark background (`DARK_BACKGROUND` in the tool).
- **Task images** (text-based, only in the tasks): `FACES` (built from hair, brows, eyes and mouth), `POSTURES` (stick figures), `FOOD`, `CODE`. Draw them between `` String.raw` `` and `` ` ``. Never use the backtick inside an image, and if an image's last line ends with a backslash `\`, put the closing `` ` `` on a new line.
- `WORK`: what each worker is given in each kind of task (which images, CAPTCHA prompts, pairs, labels).
- `TASK_TEXT` and `REASONS`: task titles and instructions, the reasons shown in the review.
- `PEOPLE` and `STORY`: the other workers, the opening messages, the question and its hints, the union steps, the break room, chat replies, ghosts, and the keywords used to read typed answers.

## Limits
- Typed answers are understood by keyword lists (in English, plus a few Spanish words), not by real language understanding.
- It's single-player: the other workers are written characters, and their chat replies are prewritten.

## Future additions
- Use the Gen Z slang dataset (https://huggingface.co/datasets/MLBtrio/genz-slang-dataset) to generate the coworkers' texts.
