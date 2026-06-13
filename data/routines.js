// data/routines.js
// Workout split: 5 days/week, full commercial gym (Planet Fitness)
// Goals: strength, lean athletic build, V-taper/abs, calisthenics, stamina

const WORKOUT_SPLIT = [
  {
    day: 1,
    name: "Push",
    focus: "Chest, Shoulders, Triceps + Core",
    tag: "Strength",
    exercises: [
      { name: "Barbell or Machine Bench Press", sets: "4", reps: "5-8" },
      { name: "Seated Overhead Press", sets: "3", reps: "6-10" },
      { name: "Incline Dumbbell Press", sets: "3", reps: "8-12" },
      { name: "Cable Lateral Raises", sets: "3", reps: "12-15" },
      { name: "Triceps Pushdowns", sets: "3", reps: "10-15" },
      { name: "Hanging Leg Raises", sets: "3", reps: "10-15" },
      { name: "Plank (weighted if possible)", sets: "3", reps: "30-60s" }
    ]
  },
  {
    day: 2,
    name: "Pull",
    focus: "Back, Biceps + Core (V-Taper)",
    tag: "Strength",
    exercises: [
      { name: "Lat Pulldown (wide grip)", sets: "4", reps: "6-10" },
      { name: "Seated Cable Row", sets: "3", reps: "8-12" },
      { name: "Single-Arm Dumbbell Row", sets: "3", reps: "10-12" },
      { name: "Face Pulls", sets: "3", reps: "12-15" },
      { name: "Cable or Dumbbell Bicep Curls", sets: "3", reps: "10-12" },
      { name: "Hollow Body Hold", sets: "3", reps: "20-40s" },
      { name: "Cable Woodchoppers (obliques)", sets: "3", reps: "12-15 / side" }
    ]
  },
  {
    day: 3,
    name: "Legs",
    focus: "Quads, Hamstrings, Glutes, Calves + Core",
    tag: "Strength",
    exercises: [
      { name: "Squat (or Leg Press)", sets: "4", reps: "5-8" },
      { name: "Romanian Deadlift", sets: "3", reps: "8-10" },
      { name: "Walking Lunges", sets: "3", reps: "10-12 / leg" },
      { name: "Leg Curl Machine", sets: "3", reps: "10-12" },
      { name: "Standing Calf Raises", sets: "4", reps: "12-15" },
      { name: "Weighted Sit-Ups", sets: "3", reps: "12-15" },
      { name: "Side Plank", sets: "3", reps: "30-45s / side" }
    ]
  },
  {
    day: 4,
    name: "Calisthenics & Upper",
    focus: "Bodyweight Skills + Chest/Back Hypertrophy",
    tag: "Calisthenics",
    exercises: [
      { name: "Pull-Up or Chin-Up (assisted if needed)", sets: "4", reps: "AMRAP" },
      { name: "Archer or Decline Push-Ups", sets: "3", reps: "8-12" },
      { name: "Dip (assisted if needed)", sets: "3", reps: "8-12" },
      { name: "Cable Fly", sets: "3", reps: "12-15" },
      { name: "Machine Row", sets: "3", reps: "10-12" },
      { name: "Ab Wheel Rollout", sets: "3", reps: "8-12" },
      { name: "Negative Pull-Up Practice", sets: "3", reps: "3-5 (slow)" }
    ]
  },
  {
    day: 5,
    name: "Core & Conditioning",
    focus: "Core Circuit + Athletic Stamina",
    tag: "Conditioning",
    exercises: [
      { name: "Hanging Windshield Wipers", sets: "3", reps: "8-10 / side" },
      { name: "L-Sit Hold (or tuck progression)", sets: "4", reps: "10-20s" },
      { name: "Dragon Flag Progression", sets: "3", reps: "5-8" },
      { name: "Plank to Push-Up", sets: "3", reps: "10-12" },
      { name: "Stairmaster or Incline Treadmill Intervals", sets: "1", reps: "15-20 min" },
      { name: "Jump Rope Finisher", sets: "3", reps: "60s" }
    ]
  }
];

// Map JS getDay() (0=Sun..6=Sat) to a workout split day, or null for rest
// Mon-Fri = training days (1-5), Sat/Sun = rest
const WEEKDAY_TO_SPLIT = {
  0: null, // Sunday - rest
  1: 1,    // Monday - Push
  2: 2,    // Tuesday - Pull
  3: 3,    // Wednesday - Legs
  4: 4,    // Thursday - Calisthenics & Upper
  5: 5,    // Friday - Core & Conditioning
  6: null  // Saturday - rest
};

function getSplitDayForDate(date) {
  const dow = date.getDay();
  const splitDay = WEEKDAY_TO_SPLIT[dow];
  if (splitDay === null) return null;
  return WORKOUT_SPLIT.find(d => d.day === splitDay) || null;
}
