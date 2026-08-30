# Fitness App Prompt Plan

This document reviews the app brief in [CodePrompt.txt](CodePrompt.txt) and turns it into a practical iterative build plan for creating and checking progress on the project.

## 1. Product Review

The current brief describes a browser-based gym tracking app focused on strength training and personal training workflows. The core value is:

- Planning training sessions in PT mode
- Running workouts in Training mode
- Reviewing training progress in Reporting mode
- Keeping the app self-contained and usable on desktop and mobile browsers
- Saving data locally in the browser and allowing JSON/CSV export

### Strengths of the brief

- Clear functional separation: PT mode, Training mode, Reporting mode
- Good domain understanding: sessions, sections, activities, sets, reps, rest, RPE, notes, links
- Strong data requirements: local persistence, import/export, spreadsheet-friendly export
- Realistic mobile-first/browser-only requirement

### Gaps and ambiguities to resolve early

Before building, clarify these decisions:

1. User roles
   - Is this for one user only, or will there be multiple trainers and athletes? Only one user, who will plan their own gym sessions. This is just for one user.
   - Does PT mode mean a trainer creates plans, or just a personal user arranging their own plan? Only one user, who will plan their own gym sessions, however, I may share the code and data-file with another user.


2. Data model details
   - Can an activity have variable reps per set, or is it always a single rep target? The target may be a rep range (e.g. 5-8)
   - Does "each set may be different" mean a list of per-set rep values, or a range/target? The rep target may change on each set. e.g. 5,3,2 decreasing the reps per set.
   - Should rest time be stored per activity or per set?
   per activity

3. Deload flow
   - Is deload week a toggle on a session, or a full alternate session template?
   it is an alternate session template. When creating a deload week, the user should be able to edit from the normal template.
   - Should the app automatically swap in deload sessions or show a separate deload schedule?
   show a deload schedule.

4. Exercise logging
   - Does the app log only completed sets, or also incomplete/failed sets? only successful sets.
   - Are weights recorded as per set, per exercise, or per session? weights should be recorded per set.

5. Reporting
   - What is the final reporting output: simple trend lines, tables, weekly volume, top sets, or progress charting?
   - Should reporting be per exercise, per session, or by movement pattern?
   The reporting can be per exercise. For this iteration, allow the user to see the full history of each exercise (recorded weight for each set).

6. Import/export
   - Should JSON plans be full plan definitions or stored workout logs as well?
   JSON plans can be just the plan definition.
   - Should CSV export be for plan structure, workout logs, or both?
   csv for workout logs.

7. Browser limits
   - Is offline support required after first load?
   the code should be distribuatable in a zip file with the user opening an HTML page to run the app.
   - Does local persistence need IndexedDB or localStorage?
   localStorage

---

## 2. Recommended Product Scope

### MVP (recommended first release)

- Browser-based SPA for desktop and mobile
- PT mode for creating plans with:
  - training plan
  - sessions
  - sections
  - activities
- Local browser storage for saved plans and workout history
- Training mode that lets the user:
  - select a session
  - move through activities
  - log exercises with actual completed set values
  - mark completion
- Deload session handling
- JSON import/export for plans
- CSV export for workout/session records
- Basic reporting by activity

### Post-MVP features

- Multi-user or trainer-client support
- Advanced analytics and charts
- More flexible exercises and templates
- Offline-first storage
- Advanced CSV/JSON validation
- Shared plan versions and backups

---

## 3. Suggested Technical Architecture

### Recommended stack

A simple, maintainable browser app is best built with:

- Frontend: React + Vite
- Styling: CSS modules or Tailwind
- State management: React state + local storage persistence or a lightweight store
- Storage: localStorage for simple implementation; IndexedDB for more substantial offline data if needed
- Data format: JSON for plan structures and workout logs; CSV export from JSON data

### Folder structure

```text
fitness-app/
  src/
    app/
      App.jsx
      routes/
    components/
      common/
      pt-mode/
      training-mode/
      reporting-mode/
    features/
      plans/
      sessions/
      activities/
      logging/
      reports/
    data/
      schema.js
      sampleData.js
    hooks/
      useLocalStorage.js
    utils/
      csv.js
      json.js
      date.js
    styles/
      globals.css
  public/
  package.json
  vite.config.js
```

### Core data model

```js
{
  planId: "plan-001",
  planName: "Strength Block",
  startDate: "2026-08-29",
  deloadWeek: {
    enabled: true,
    weekNumber: 4,
    mode: "replace-normal-session"
  },
  sessions: [
    {
      sessionId: "session-001",
      name: "Upper Body A",
      sections: [
        {
          sectionId: "section-001",
          name: "Push",
          activities: [
            {
              activityId: "activity-001",
              name: "Bench Press",
              sets: 5,
              repsPerSet: [5, 5, 5, 5, 5],
              restSeconds: 180,
              targetRpe: 8,
              notes: "Pause on chest",
              links: ["https://example.com/video"],
              actualLog: [
                { set: 1, weight: 80, reps: 5, rpe: 8, completed: true },
                { set: 2, weight: 82.5, reps: 5, rpe: 8, completed: true }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

This structure aligns well with the brief and keeps plan data easy to export/import.

---

## 4. Iterative Build Plan

Use the following milestones to build the app in stages and check progress after each stage.

### Iteration 1: App foundation and shell

Goal: Create a working browser app shell with navigation and layout.

Build:
- Create Vite React app
- Add responsive layout for desktop/mobile
- Add top navigation: PT mode, Training mode, Reporting mode
- Create basic empty states and screens
- Add a theme and spacing system

Acceptance criteria:
- User can switch between the three modes
- App renders correctly on desktop and phone-sized screens
- Base structure is present without broken layouts

Prompt to generate this iteration:

```text
Create a browser-based fitness app shell in React with three main views: PT Mode, Training Mode, and Reporting Mode. Use a clean responsive layout that works on desktop and mobile. Include a navigation bar, placeholder panels for each section, and a consistent card-based design. Keep the app self-contained with no backend.
```

### Iteration 2: PT mode plan builder

Goal: Allow a user to build a training plan.

Build:
- Plan creation form
- Session list and session editor
- Section management
- Activity form with fields for set count, reps, rest, RPE, notes, links
- Save to local storage

Acceptance criteria:
- User can create a plan
- User can add sessions, sections, and activities
- Activity fields match the brief
- Data persists after refresh

Prompt to generate this iteration:

```text
Build PT Mode for a strength training app. Add a training plan editor where the user can create a plan, add sessions, sections, and activities. Each activity must include sets, reps per set, rest time, target RPE, notes, and links. Persist all data in browser storage and allow editing/deleting items. Use a mobile-friendly form layout.
```

### Iteration 3: Deload week functionality

Goal: Add periodisation logic for deload weeks.

Build:
- Deload week configuration
- Ability to convert a session into a deload session
- Deload session view and logic
- Auto-show deload sessions during deload week

Acceptance criteria:
- User can mark a week as deload
- Deload sessions are clearly distinguished from normal sessions
- Training mode shows deload sessions automatically when appropriate

Prompt to generate this iteration:

```text
Add deload week support to the fitness app. Include a configuration for deload week period, the ability to mark a normal session as a deload session, and logic that automatically presents deload sessions in the training flow during that period. Make the UI clearly indicate whether a session is normal or deload.
```

### Iteration 4: Training mode workout logger

Goal: Allow completion of planned workouts.

Build:
- Session selection screen
- Activity-by-activity workout checklist
- Actual logging fields: weight, reps, RPE, completion check
- Ability to move through each activity in a session
- Save log entries to history

Acceptance criteria:
- User can select a session and complete each activity
- Actual set values are captured and saved
- Each activity can be marked complete
- Data is preserved and retrievable later

Prompt to generate this iteration:

```text
Build Training Mode where the user selects a session and logs each activity one after another. For each activity, capture actual weight, reps, RPE, and completion status for each set. Include a simple progress flow through the session and save completed logs to browser storage so the user can review them later.
```

### Iteration 5: Reporting mode

Goal: Add progress insights.

Build:
- Per-activity reporting dashboard
- See historical performance over time
- Compare target vs actual data
- Basic trend or table-based view

Acceptance criteria:
- User can view progress for each activity
- Data is aggregated from workout logs
- Report is readable in a mobile layout

Prompt to generate this iteration:

```text
Create Reporting Mode for the fitness app. Show progress for each activity based on logged workout data. Include a simple table and/or chart view with historical performance, workout volume, and completion trends. The user should be able to analyze each activity over time without needing a backend.
```

### Iteration 6: Import/export and data management

Goal: Support plan backup and portability.

Build:
- Export current plan as JSON
- Import JSON training plan
- Export session data as CSV
- Save local browser state
- Optional file download buttons

Acceptance criteria:
- User can export a plan or logs as JSON/CSV
- JSON import restores data correctly
- File handling works in browser

Prompt to generate this iteration:

```text
Add import/export capabilities to the fitness app. Include buttons to export the current training plan as JSON, import a JSON plan file, and export logged session data as CSV. Validate imported JSON and keep the app functional when data is missing or malformed.
```

### Iteration 7: Polish and final QA

Goal: Make the app reliable and polished.

Build:
- Validation and empty states
- Confirmation dialogs for delete actions
- Better mobile UX
- Consistent naming and layout
- Bug fixes from earlier iterations

Acceptance criteria:
- App is stable
- All core flows work end-to-end
- UX works on mobile and desktop
- No obvious broken states

Prompt to generate this iteration:

```text
Polish the fitness app and perform a full QA pass. Improve the user experience on mobile and desktop, clean up empty states, add validation messages, ensure data persistence works reliably, and fix any issues that appear during normal PT, training, reporting, and import/export flows.
```

---

## 5. Progress Check Framework

After each iteration, verify with a short checklist:

### Functional checks
- Can the user complete the task without confusion?
- Does the feature persist correctly after refresh?
- Does the UI work on a narrow phone viewport?
- Does the feature behave correctly for empty and invalid data?

### Product checks
- Does this feature align to the original brief?
- Does it feel complete enough to move to the next phase?
- Are there new ambiguities that must be defined before continuing?

### QA checklist
- Add a plan
- Edit a session
- Save and reload
- Record workout data
- View reporting data
- Export/import JSON
- Check mobile responsiveness

---

## 6. Suggested Next Prompt Template

Use this when continuing development with an AI assistant:

```text
Act as a senior product engineer and front-end developer. Build the next phase of this browser-based fitness application.

Requirements:
- Keep it as a self-contained browser app that works on desktop and mobile
- Prioritize a clean, responsive UI
- Use React and a structured component architecture
- Implement the feature described below
- Store data in browser local storage
- Preserve a clear separation between PT Mode, Training Mode, and Reporting Mode
- Explain what was built, what assumptions were made, and any follow-up items

Feature to build:
[Describe the exact feature to implement]

Acceptance criteria:
- [List concrete outcomes]
- [List edge cases to consider]
- [List UI behavior expected on mobile]

Output format:
1. Brief summary of what changed
2. Key files/components created or updated
3. Verification notes
4. Remaining gaps or next recommended step
```

---

## 7. Recommended Implementation Order

1. App shell and navigation
2. Plan/session/activity data model
3. PT mode editing
4. Training mode logging
5. Deload logic
6. Reporting mode
7. Import/export
8. UX polish and QA

This order reduces risk and keeps the app grounded in the original brief before adding advanced analytics and data features.

---

## 8. Final Recommendation

The brief is good enough to build an MVP, but it needs a few product decisions clarified before long-term work begins. The strongest path is to build a responsive React app with a clean data model, local browser persistence, and a staged feature rollout.

If you want, the next step can be to turn this plan into:

- a full technical specification,
- a sprint-by-sprint backlog,
- or a set of AI-ready generation prompts for each phase.
