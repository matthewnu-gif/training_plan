# Fitness App Build Prompts

This document contains a sequence of AI-ready prompts for building the fitness app in clear, testable iterations.

## Shared Context for All Prompts

```text
Act as a senior product engineer and front-end developer.

Project context:
- Build a self-contained browser-based fitness app for strength training.
- This is a single-user app for one person to plan and track their own gym sessions.
- The app should work on desktop and mobile browsers.
- It should be distributable as a zip file where the user can open a local HTML page to run the app without installing anything.
- Use localStorage for persistence.
- Keep the code as a simple frontend app with no backend.
- The app should be structured cleanly using React and sensible component folders.

Key business rules:
- PT mode is used to create and manage training plans.
- A plan contains sessions.
- Each session contains sections.
- Each section contains activities.
- Activities include: number of sets, target reps per set, rep target range or varied rep progression per set, rest time, target RPE, notes, and links.
- Rest time is stored per activity, not per set.
- The user may plan their own sessions and may also share the code/data file with another user later.
- Deload weeks use an alternate session template rather than replacing the base session outright.
- Deload sessions should be shown in a separate deload schedule view rather than automatically swapping the whole training plan.
- Training mode logs only successful sets.
- Weight is logged per set.
- Reporting is per exercise and shows the historical weight record for each set across time.
- JSON export/import should contain the plan definition only.
- CSV export should be for workout logs only.
- Keep the interface clean, responsive, and easy to use on mobile.
```

---

## 1) Prompt: App Shell and Navigation

```text
Build the initial shell of the fitness app.

Requirements:
- Create a browser-based app with three main views: PT Mode, Training Mode, and Reporting Mode.
- Use React and a clean mobile-friendly layout.
- Include a responsive top navigation bar and a clear card-based UI.
- Add placeholder screens for each mode.
- Keep the app self-contained and easy to run from a local HTML page.
- Use localStorage-ready structure even if no data is populated yet.
- Make it work for both desktop and phone-sized screens.

Acceptance criteria:
- User can switch between PT, Training, and Reporting views.
- The layout is visually clean and responsive.
- The app has a base structure without broken layout states.
- The app includes empty-state screens for each mode.
- No backend is required.

Output:
- Brief summary of what was built
- Key files/components created
- Notes on layout decisions and responsiveness
- Any assumptions or follow-up items
```

---

## 2) Prompt: PT Mode Plan Builder

```text
Build PT Mode for the fitness app.

Project context:
- This is a single-user gym tracking app.
- PT Mode is where the user creates their training plan.
- Each training plan contains sessions.
- Sessions contain sections.
- Sections contain activities.
- Each activity should include:
  - number of sets
  - target reps per set, where each set may vary (for example: 5, 3, 2)
  - rep range support, such as 5-8
  - rest time between sets
  - target RPE
  - notes
  - links
- Data should persist in localStorage.

Requirements:
- Allow the user to create, edit, and delete plans.
- Allow the user to add sessions, sections, and activities.
- Make the UI work well on mobile.
- Include validation for required fields.
- Represent rep targets as either a target list or range where appropriate.
- Store all data in a structured JSON model.

Acceptance criteria:
- User can create a full training plan.
- User can add/edit/delete sessions, sections, and activities.
- Activity form includes all required fields.
- Data remains after refresh.
- UI is usable on a phone-sized viewport.
- App is clear and easy to navigate.

Output:
- Summary of implemented PT features
- Files/components involved
- Notes on data structure and persistence
- Remaining gaps or suggested next steps
```

---

## 3) Prompt: Deload Week and Alternate Session Templates

```text
Add deload week functionality to the app.

Project context:
- Deload weeks are managed using an alternate session template rather than a complete replacement of the normal plan.
- A user should be able to create a deload week and then edit a normal session into a deload session.
- Deload sessions should appear in a separate deload schedule rather than automatically swapping the main plan.
- The user should be able to distinguish normal sessions from deload sessions visually.

Requirements:
- Add a deload week configuration section.
- Allow the user to mark a session as a deload session.
- Allow the user to convert a normal template into a deload version.
- Show deload sessions in a dedicated schedule view.
- Keep data in localStorage.
- Maintain the separation between normal and deload sessions.

Acceptance criteria:
- User can create a deload week schedule.
- User can edit a standard session into a deload session.
- Deload session is clearly marked in the UI.
- The deload view is separate from the normal training schedule.
- The flow is usable on mobile and desktop.

Output:
- Summary of deload implementation
- Data model changes
- UI approach for separation of normal vs deload sessions
- Notes on any edge cases or follow-up improvements
```

---

## 4) Prompt: Training Mode Workout Logger

```text
Build Training Mode for logging completed workouts.

Project context:
- Training mode allows the user to select a session and progress through each activity.
- The user logs actual completion for each set.
- Only successful sets are recorded.
- Weight should be logged per set.
- Each set may have actual reps completed, actual weight used, and an RPE value.
- The user should be able to mark an activity as complete.

Requirements:
- Add a session selection screen.
- Allow navigation through activities in order.
- For each activity, capture details for each set:
  - weight
  - reps completed
  - RPE
  - completed status
- Persist workout logs in localStorage.
- Allow the user to move forward through the session and review progress.
- Keep the flow simple and easy to use on mobile.

Acceptance criteria:
- User can select a session and complete the workout log.
- Each set records actual weight, reps, RPE, and successful completion.
- Activities can be marked complete.
- Logged data is saved and remains after refresh.
- The interface works on mobile screens without awkward form layouts.

Output:
- Summary of the training logging flow
- Key components and data structures used
- Notes on the save pattern and validation
- Any issues or improvements still needed
```

---

## 5) Prompt: Reporting Mode Per-Exercise History

```text
Create Reporting Mode for exercise progress tracking.

Project context:
- Reporting is per exercise.
- The user should be able to view the full history of each exercise.
- For each exercise, they should see the recorded weight for each set over time.
- This is not a multi-user or trainer dashboard.
- Keep it simple and readable.
- Use browser localStorage instead of a backend.

Requirements:
- Collect historical logs for each exercise from the workout records.
- Display per-exercise history in a readable format.
- Show the recorded weight for each successful set over time.
- Include enough structure to compare progress across sessions.
- Make the report usable on mobile and desktop.

Acceptance criteria:
- User can select an exercise and review its full log history.
- The report shows historical set-by-set weight data.
- The view is readable and understandable.
- The app uses stored workout data and not mock data only.
- No backend is required.

Output:
- Summary of the reporting view
- Description of the data aggregation approach
- UI explanation and layout decisions
- Remaining enhancements for future versions
```

---

## 6) Prompt: Import / Export and Data Management

```text
Add JSON import/export and CSV workout export to the fitness app.

Project context:
- JSON import/export should handle the plan definition only.
- CSV export should contain workout logs.
- Data persistence should remain in localStorage.
- The app should be easy to distribute as a zip file and run locally in a browser.
- Imported JSON should be validated for missing or malformed data.

Requirements:
- Add a button to export the current training plan as JSON.
- Add a button to import a JSON plan file.
- Add a button to export workout data as CSV.
- Include safe handling for invalid import files.
- Keep the export/import flow simple and browser-native.
- Ensure app remains stable after importing or exporting.

Acceptance criteria:
- User can download a valid JSON plan file.
- User can import a JSON plan and restore it successfully.
- CSV export contains workout logs in a usable format.
- Invalid JSON does not break the app.
- The feature works on mobile and desktop.

Output:
- Summary of file handling implementation
- Notes on JSON structure and CSV export format
- Validation logic used for invalid files
- Follow-up improvements if needed
```

---

## 7) Prompt: Final QA and UX Polish

```text
Polish the fitness app and perform a full quality assurance pass.

Project context:
- The app is a single-user browser-based training tracker.
- It should feel clean, reliable, and responsive across desktop and mobile screens.
- Data is persisted in localStorage.
- The app supports PT planning, training mode logging, reporting, and import/export.

Requirements:
- Improve the overall UX and visual consistency across all views.
- Add validation and empty states.
- Improve mobile usability.
- Add confirmation prompts for destructive actions like delete.
- Ensure all flows are stable end-to-end.
- Fix issues discovered in earlier iterations.
- Keep the app simple and intuitive for a gym user.

Acceptance criteria:
- All core flows work without visible bugs.
- Plan creation and editing are stable.
- Workout logging works reliably.
- Deload route and reporting flow work properly.
- Import/export and save/reload behavior are consistent.
- The app is responsive and polished on mobile.

Output:
- Summary of polish updates
- QA checks completed
- Remaining known issues or future improvements
```

---

## Optional: One-Click Master Prompt

```text
Act as a senior product engineer and front-end developer.

Build a browser-based, single-user fitness app for strength training. The app should be self-contained, run in a browser, and work on desktop and mobile devices. It should be distributable as a zip file where the user opens a local HTML page to run it, with no backend or install step required.

The app must support:
- PT Mode for creating training plans
- Sessions containing sections and activities
- Activities with number of sets, target reps per set or a varied rep progression, rest time, target RPE, notes, and links
- Deload weeks using alternate session templates
- Training Mode to log actual completed sets with weight, reps, RPE, and completion status
- Reporting Mode showing per-exercise historical weight progression
- JSON import/export for training plan definitions
- CSV export for workout logs
- localStorage persistence

Important rules:
- This is a single-user app.
- The app may be shared with another user later by sharing the code and data file.
- Rest time is stored per activity.
- Only successful sets are logged.
- Weight is recorded per set.
- Reporting is per exercise and shows the set-by-set history of weight.
- Deload sessions should be presented in a separate deload schedule, not automatically replace the main plan.
- JSON plans are only plan definitions.
- CSV is for workout logs only.

Build the app in a clean React structure with sensible folders and components. Keep the UI easy to use on mobile and desktop, and make the data model clear and exportable.

Please provide:
1. A short summary of the feature built
2. The main files/components you created
3. Notes on responsive design and local storage behavior
4. Any assumptions or follow-ups
5. A concise QA checklist for validating the app
```

---

## Recommended Use

- Run the prompts in order.
- Validate each step before moving to the next.
- Use the acceptance criteria as the review gate for each iteration.
- Keep scope tight so the app remains stable and easy to debug.
