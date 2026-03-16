import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.scheduleEntry.deleteMany();
  await prisma.weekSchedule.deleteMany();
  await prisma.setLog.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.section.deleteMany();
  await prisma.programDay.deleteMany();
  await prisma.program.deleteMany();
  await prisma.profile.deleteMany();

  // Create default profile
  const defaultProfile = await prisma.profile.create({
    data: { name: "Default" },
  });
  console.log(`Default profile: ${defaultProfile.name} (${defaultProfile.id})`);

  const program = await prisma.program.create({
    data: {
      name: "4-Day Vertical Jump Program",
      description:
        "Reorganized from 30+ trainer/PT sessions into a repeatable 4-day weekly program. Train 4 days per week. Rest or light mobility on off days.",
    },
  });

  // ═══════════════════════════════════════════════════════
  // DAY 1: LOWER STRENGTH
  // ═══════════════════════════════════════════════════════
  const day1 = await prisma.programDay.create({
    data: {
      programId: program.id,
      name: "Lower Strength",
      focus: "Squat patterns, hip hinge, single-leg strength",
      dayNumber: 1,
      totalTime: "55-60 min",
    },
  });

  // Day 1 - Activation
  const d1Activation = await prisma.section.create({
    data: {
      programDayId: day1.id,
      name: "Activation",
      type: "activation",
      order: 1,
      restSeconds: 30,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d1Activation.id,
        name: "Banded Monster Walk",
        description:
          "Forward, backward, lateral. Double band at ankles + above knees. Stay low in quarter-squat.",
        sets: 3,
        reps: "10 steps each direction",
        order: 1,
      },
      {
        sectionId: d1Activation.id,
        name: "Single Leg Glute Bridge March",
        description:
          "Laying on back, drive hips up, alternate extending one leg at a time. Keep hips level.",
        sets: 3,
        reps: "45 seconds",
        order: 2,
      },
      {
        sectionId: d1Activation.id,
        name: "Ankle Mobility Against Wall",
        description:
          "Front foot 4 inches from wall, drive knee over toes without heel lifting.",
        sets: 3,
        reps: "5 each side",
        order: 3,
      },
      {
        sectionId: d1Activation.id,
        name: "Prone Press Up",
        description:
          "Lying on stomach, hands by shoulders. Press upper body up, keeping hips on floor. Exhale on press. Lumbar extension prep before heavy loading.",
        sets: 1,
        reps: "10",
        order: 4,
      },
      {
        sectionId: d1Activation.id,
        name: "Supine Hip IR/ER Rotation",
        description:
          "Lying on back, knees bent, feet wider than hips. Let both knees fall to one side, then the other. Controlled hip rotation to prep for squats and hinges.",
        sets: 2,
        reps: "10 each side",
        order: 5,
      },
    ],
  });

  // Day 1 - Main Work Block A
  const d1MainA = await prisma.section.create({
    data: {
      programDayId: day1.id,
      name: "Strength Block A",
      type: "main",
      order: 2,
      restSeconds: 105,
      notes: "Rest 90-120s between sets on main lifts.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d1MainA.id,
        name: "Barbell Front Squat",
        description:
          "Elbows high, sit between hips, knees tracking over toes. Full depth.",
        sets: 4,
        reps: "8",
        order: 1,
      },
      {
        sectionId: d1MainA.id,
        name: "Barbell Deadlift",
        description:
          "Conventional stance. Hinge at hips, flat back, drive through heels. Lock out with glutes.",
        sets: 4,
        reps: "6",
        order: 2,
      },
    ],
  });

  // Day 1 - Main Work Block B
  const d1MainB = await prisma.section.create({
    data: {
      programDayId: day1.id,
      name: "Strength Block B",
      type: "main",
      order: 3,
      restSeconds: 75,
      notes: "Rest 60-90s between sets.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d1MainB.id,
        name: "Front-Foot-Elevated Bulgarian Split Squat + Hold",
        description:
          "Hold DBs or use barbell. Rear foot on bench. Knee tracks over toe. 10s hold at bottom on last rep.",
        sets: 3,
        reps: "8 each leg",
        order: 1,
      },
      {
        sectionId: d1MainB.id,
        name: "Barbell RDL",
        description:
          "Slight knee bend, push hips back, feel hamstring stretch. Bar stays close to legs.",
        sets: 4,
        reps: "6",
        order: 2,
      },
    ],
  });

  // Day 1 - Accessory
  const d1Accessory = await prisma.section.create({
    data: {
      programDayId: day1.id,
      name: "Accessory Work",
      type: "accessory",
      order: 4,
      restSeconds: 50,
      notes: "Rest 45-60s between sets.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d1Accessory.id,
        name: "Wall Sit",
        description:
          "Hold DBs or KBs at sides. Knees at 90°, knees over heels, toes up, abs pressed into wall.",
        sets: 3,
        reps: "1 min",
        order: 1,
      },
      {
        sectionId: d1Accessory.id,
        name: "Physioball Hamstring Curls",
        description:
          "Hips up in bridge position, curl ball toward glutes, extend slowly.",
        sets: 3,
        reps: "10",
        order: 2,
      },
      {
        sectionId: d1Accessory.id,
        name: "Glute/Ham Raise",
        description:
          "Or Nordic curl variation. Controlled eccentric. Use band for assistance if needed.",
        sets: 3,
        reps: "8",
        order: 3,
      },
    ],
  });

  // Day 1 - Cool-Down
  const d1Cooldown = await prisma.section.create({
    data: {
      programDayId: day1.id,
      name: "Cool-Down",
      type: "cooldown",
      order: 5,
      notes: "Foam rolling and static stretching.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d1Cooldown.id,
        name: "Foam Roll: Quads, Hamstrings, Calves, TFL, IT Bands",
        description: "Use lacrosse ball for TFL. 60s each area.",
        sets: 1,
        reps: "60s each",
        order: 1,
      },
      {
        sectionId: d1Cooldown.id,
        name: "Hamstring Static Series with Strap",
        description:
          "Straight up, across body, open out. 30s each position, each leg.",
        sets: 1,
        reps: "30s each position",
        order: 2,
      },
      {
        sectionId: d1Cooldown.id,
        name: "Calf Stretch",
        description: "Hang heels off step.",
        sets: 1,
        reps: "60s",
        order: 3,
      },
      {
        sectionId: d1Cooldown.id,
        name: "Hip Flexor Lunge Stretch",
        description: "30s each side.",
        sets: 1,
        reps: "30s each side",
        order: 4,
      },
    ],
  });

  // ═══════════════════════════════════════════════════════
  // DAY 2: UPPER BODY + CORE
  // ═══════════════════════════════════════════════════════
  const day2 = await prisma.programDay.create({
    data: {
      programId: program.id,
      name: "Upper Body + Core",
      focus: "Push/pull balance, scapular health, trunk stability",
      dayNumber: 2,
      totalTime: "50-55 min",
    },
  });

  // Day 2 - Activation
  const d2Activation = await prisma.section.create({
    data: {
      programDayId: day2.id,
      name: "Activation",
      type: "activation",
      order: 1,
      restSeconds: 30,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d2Activation.id,
        name: "Band Complex",
        description:
          "5 each: retract, reverse fly, upright row, regular row, palms behind body. Light band. Slow and controlled.",
        sets: 3,
        reps: "5 each movement",
        order: 1,
      },
      {
        sectionId: d2Activation.id,
        name: "Wall Angels",
        description:
          'Back flat against wall, arms in "W" position, slide up to "Y" and back down. Keep wrists and elbows touching wall.',
        sets: 3,
        reps: "10",
        order: 2,
      },
      {
        sectionId: d2Activation.id,
        name: "Physioball Scap Complex",
        description:
          "Lay chest on physioball, lift arms in Y, T, W, I positions. Squeeze shoulder blades.",
        sets: 2,
        reps: "5 each position",
        order: 3,
      },
      {
        sectionId: d2Activation.id,
        name: "Sidelying Thoracic Rotation (Open Book)",
        description:
          "Lying on side, knees bent 75°, arms together in front. Slide top hand over bottom hand 5 times, then lift top arm up and over to floor on other side. Keep knees together — only rotate upper back.",
        sets: 2,
        reps: "10 each side",
        order: 4,
      },
    ],
  });

  // Day 2 - Main Work Push/Pull
  const d2Main = await prisma.section.create({
    data: {
      programDayId: day2.id,
      name: "Push/Pull Block",
      type: "main",
      order: 2,
      restSeconds: 75,
      notes: "Rest 60-90s between sets.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d2Main.id,
        name: "Single Arm Cable Row",
        description:
          "Stand in split stance. Pull to hip, squeeze shoulder blade back. No torso rotation.",
        sets: 3,
        reps: "10 each arm",
        order: 1,
      },
      {
        sectionId: d2Main.id,
        name: "Single Arm Cable Press",
        description:
          "Stand in split stance. Press from chest height. Core braced, no leaning.",
        sets: 3,
        reps: "10 each arm",
        order: 2,
      },
      {
        sectionId: d2Main.id,
        name: "DB Curl to Press (Standing on One Leg)",
        description:
          "Curl dumbbells, then press overhead. One foot elevated on bench behind you. Alternate standing leg each set.",
        sets: 3,
        reps: "5 each side",
        order: 3,
      },
      {
        sectionId: d2Main.id,
        name: "Pull-Ups or Banded Assisted Pull-Ups",
        description:
          "Full dead hang at bottom, chin over bar at top. Use band for assistance as needed.",
        sets: 3,
        reps: "6-8",
        order: 4,
      },
    ],
  });

  // Day 2 - Accessory
  const d2Accessory = await prisma.section.create({
    data: {
      programDayId: day2.id,
      name: "Accessory Work",
      type: "accessory",
      order: 3,
      restSeconds: 50,
      notes: "Rest 45-60s between sets.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d2Accessory.id,
        name: "DB Shoulder Press (Standing on One Leg)",
        description: "Alternate standing leg each set. Core engaged throughout.",
        sets: 3,
        reps: "8",
        order: 1,
      },
      {
        sectionId: d2Accessory.id,
        name: "Rope Face Pulls",
        description:
          "Pull to forehead level, externally rotate at end position. Squeeze rear delts.",
        sets: 3,
        reps: "10",
        order: 2,
      },
      {
        sectionId: d2Accessory.id,
        name: "Tricep Skull Crushers",
        description:
          "Elbows pointed at ceiling, lower to forehead, extend fully.",
        sets: 3,
        reps: "10",
        order: 3,
      },
    ],
  });

  // Day 2 - Core Circuit
  const d2Core = await prisma.section.create({
    data: {
      programDayId: day2.id,
      name: "Core Circuit",
      type: "core",
      order: 4,
      restSeconds: 30,
      notes:
        "Perform as a circuit. Rest 30s between exercises, 60s between rounds. 2-3 rounds.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d2Core.id,
        name: "Plank",
        description:
          "Squeeze knees together, contract pelvic floor. Elbows under shoulders.",
        sets: 3,
        reps: "30s",
        order: 1,
      },
      {
        sectionId: d2Core.id,
        name: "Side Bridge",
        description:
          "Hips forward, stack feet or stagger. Focus on pelvic floor contraction.",
        sets: 3,
        reps: "30s each side",
        order: 2,
      },
      {
        sectionId: d2Core.id,
        name: "Dead Bug",
        description:
          "Lower back pressed into floor. Opposite arm + opposite leg extend simultaneously. Exhale as you extend.",
        sets: 3,
        reps: "10 each side",
        order: 3,
      },
      {
        sectionId: d2Core.id,
        name: "Bird Dog (Banded)",
        description:
          "Band around wrists or ankles for added resistance. Extend opposite arm + leg, hold 2s at top.",
        sets: 3,
        reps: "10 each side",
        order: 4,
      },
      {
        sectionId: d2Core.id,
        name: "Body Coil",
        description:
          "Standing with arms extended, rotate trunk powerfully. Feet planted, hips stable.",
        sets: 3,
        reps: "6",
        order: 5,
      },
    ],
  });

  // Day 2 - Cool-Down
  const d2Cooldown = await prisma.section.create({
    data: {
      programDayId: day2.id,
      name: "Cool-Down",
      type: "cooldown",
      order: 5,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d2Cooldown.id,
        name: "Foam Roll: Lats, Scapula, Thoracic Spine, Chest",
        description: "Use lacrosse ball for chest. 60s each area.",
        sets: 1,
        reps: "60s each",
        order: 1,
      },
      {
        sectionId: d2Cooldown.id,
        name: "Foam Roll Thoracic Extensions",
        description: "2 min total.",
        sets: 1,
        reps: "2 min",
        order: 2,
      },
      {
        sectionId: d2Cooldown.id,
        name: "Clock Stretch",
        description: "Hold each position 15s (12, 2, 10 o'clock).",
        sets: 1,
        reps: "15s each position",
        order: 3,
      },
      {
        sectionId: d2Cooldown.id,
        name: "90/90 Stretch",
        description: "30s each side.",
        sets: 1,
        reps: "30s each side",
        order: 4,
      },
    ],
  });

  // ═══════════════════════════════════════════════════════
  // DAY 3: LOWER POWER
  // ═══════════════════════════════════════════════════════
  const day3 = await prisma.programDay.create({
    data: {
      programId: program.id,
      name: "Lower Power",
      focus: "Plyometrics, reactive strength, explosive power",
      dayNumber: 3,
      totalTime: "50-55 min",
    },
  });

  // Day 3 - Activation
  const d3Activation = await prisma.section.create({
    data: {
      programDayId: day3.id,
      name: "Activation",
      type: "activation",
      order: 1,
      restSeconds: 30,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d3Activation.id,
        name: "Side Leg Raises + Circles",
        description:
          "Lay on side, lead with heel (dorsiflexed). Circles basketball-sized.",
        sets: 3,
        reps: "10 raises + 10 circles each direction, each side",
        order: 1,
      },
      {
        sectionId: d3Activation.id,
        name: "Single Leg Glute Bridge Liftoffs",
        description: "Drive hips up on one leg, hold 1s at top. Keep hips level.",
        sets: 3,
        reps: "10 each side",
        order: 2,
      },
      {
        sectionId: d3Activation.id,
        name: "Banded Clamshells",
        description:
          "Band above knees. Side-lying, open knees apart, squeeze glute. Hold 10s on last rep.",
        sets: 3,
        reps: "10 each side",
        order: 3,
      },
      {
        sectionId: d3Activation.id,
        name: "Reverse Clamshell",
        description:
          "Side-lying, knees bent. Keep knees together, rotate top foot upward. Targets internal rotators — complements regular clamshells.",
        sets: 2,
        reps: "10 each side",
        order: 4,
      },
      {
        sectionId: d3Activation.id,
        name: "Quadruped Train Tracks",
        description:
          "On hands and knees, towel or block under one knee. Lift working knee until parallel with elevated knee, then lower. Toes stay on ground. Deep hip stabilizer activation before explosive work.",
        sets: 2,
        reps: "15 each side",
        order: 5,
      },
    ],
  });

  // Day 3 - Power Block A
  const d3PowerA = await prisma.section.create({
    data: {
      programDayId: day3.id,
      name: "Power Block A",
      type: "main",
      order: 2,
      restSeconds: 150,
      notes: "Rest 2-3 min between sets for full CNS recovery.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d3PowerA.id,
        name: "Depth Jump",
        description:
          'Step off 18-24" box, land on both feet, immediately explode upward for max height. Minimize ground contact time. Reset between each rep.',
        sets: 4,
        reps: "4",
        order: 1,
      },
      {
        sectionId: d3PowerA.id,
        name: "Skaters (Lateral Bounds)",
        description:
          "Explosive lateral push-off, land softly on outside foot. Stick each landing 1s.",
        sets: 4,
        reps: "6 each side",
        order: 2,
      },
    ],
  });

  // Day 3 - Power Block B
  const d3PowerB = await prisma.section.create({
    data: {
      programDayId: day3.id,
      name: "Power Block B",
      type: "main",
      order: 3,
      restSeconds: 105,
      notes: "Rest 90-120s between sets.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d3PowerB.id,
        name: "KB Swings",
        description:
          "Hinge at hips, explosive hip extension. Arms are just along for the ride. Bell to chest height.",
        sets: 4,
        reps: "10",
        order: 1,
      },
      {
        sectionId: d3PowerB.id,
        name: "Split Squat Jumps",
        description:
          "Lunge position, explode up, switch legs in air, land softly in lunge. Full depth each rep.",
        sets: 4,
        reps: "6 each side",
        order: 2,
      },
      {
        sectionId: d3PowerB.id,
        name: "Bunny Hops",
        description:
          "Continuous small hops, knees slightly bent, stay on balls of feet. Quick ground contact.",
        sets: 4,
        reps: "20",
        order: 3,
      },
    ],
  });

  // Day 3 - Accessory
  const d3Accessory = await prisma.section.create({
    data: {
      programDayId: day3.id,
      name: "Accessory Work",
      type: "accessory",
      order: 4,
      restSeconds: 60,
      notes: "Rest 60s between sets.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d3Accessory.id,
        name: "BB Side Lunge",
        description:
          "Barbell on back. Step wide to side, sit hips back over that leg, push back to start.",
        sets: 3,
        reps: "8 each side",
        order: 1,
      },
      {
        sectionId: d3Accessory.id,
        name: "Lateral Band Walk",
        description:
          "Band at ankles. Stay low, push knees out. Don't let feet come together.",
        sets: 3,
        reps: "10 each direction",
        order: 2,
      },
      {
        sectionId: d3Accessory.id,
        name: "Adductor Side Bridge",
        description:
          "Bottom leg on ground, top leg on bench. Bridge up from elbow. Inner thigh on fire.",
        sets: 3,
        reps: "30s each side",
        order: 3,
      },
    ],
  });

  // Day 3 - Cool-Down
  const d3Cooldown = await prisma.section.create({
    data: {
      programDayId: day3.id,
      name: "Cool-Down",
      type: "cooldown",
      order: 5,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d3Cooldown.id,
        name: "Foam Roll: Calves, Quads, Hamstrings, TFL, IT Bands",
        description: "Use lacrosse ball for TFL. 60s each area.",
        sets: 1,
        reps: "60s each",
        order: 1,
      },
      {
        sectionId: d3Cooldown.id,
        name: "Popliteus Release with Lacrosse Ball",
        description: "Behind the knee. 60s each leg.",
        sets: 1,
        reps: "60s each leg",
        order: 2,
      },
      {
        sectionId: d3Cooldown.id,
        name: "Calf Stretch",
        description: "Hang heels off step.",
        sets: 1,
        reps: "60s",
        order: 3,
      },
      {
        sectionId: d3Cooldown.id,
        name: "Hip Flexor Lunge Stretch with Yoga Blocks",
        description: "10 knee drops + 30s hold each side.",
        sets: 1,
        reps: "10 drops + 30s hold each side",
        order: 4,
      },
      {
        sectionId: d3Cooldown.id,
        name: "Adductor Stretch",
        description: "30s each side.",
        sets: 1,
        reps: "30s each side",
        order: 5,
      },
    ],
  });

  // ═══════════════════════════════════════════════════════
  // DAY 4: ATHLETIC FULL BODY
  // ═══════════════════════════════════════════════════════
  const day4 = await prisma.programDay.create({
    data: {
      programId: program.id,
      name: "Athletic Full Body",
      focus: "Movement quality, complexes, rotational power, agility",
      dayNumber: 4,
      totalTime: "55-60 min",
    },
  });

  // Day 4 - Activation
  const d4Activation = await prisma.section.create({
    data: {
      programDayId: day4.id,
      name: "Activation",
      type: "activation",
      order: 1,
      restSeconds: 30,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d4Activation.id,
        name: "Physioball Dead Bug",
        description:
          "Hold physioball between opposite hand and knee. Extend free arm + leg. Keep lower back flat.",
        sets: 2,
        reps: "10 each side",
        order: 1,
      },
      {
        sectionId: d4Activation.id,
        name: "Physioball Plank Circles",
        description:
          "Forearms on physioball in plank position. Make small circles. Core locked in.",
        sets: 2,
        reps: "10 each direction",
        order: 2,
      },
      {
        sectionId: d4Activation.id,
        name: "TA March",
        description:
          "Lying on back, knees bent, feet flat. Tighten abdominals, slowly raise one leg keeping knee bent, return, repeat other side. Keep trunk stiff and low back flat — don't let it arch.",
        sets: 2,
        reps: "15 each side",
        order: 3,
      },
      {
        sectionId: d4Activation.id,
        name: "Forward T (Single-Leg Balance)",
        description:
          "Standing upright, hands at waist. Balance on one leg, hinge at hips and tilt forward while extending other leg backward (body forms a T). Return and repeat. Keep back straight, don't let knee collapse inward.",
        sets: 2,
        reps: "10 each side",
        order: 4,
      },
    ],
  });

  // Day 4 - Complex Block
  const d4Main = await prisma.section.create({
    data: {
      programDayId: day4.id,
      name: "Complex Block",
      type: "main",
      order: 2,
      restSeconds: 90,
      notes: "Rest 90s between sets.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d4Main.id,
        name: "BB Warm-Up Complex",
        description:
          "5 each: back squat → snatch grip press → good morning → bent-over row. Use empty bar or light load. No rest between movements.",
        sets: 3,
        reps: "5 each movement",
        order: 1,
      },
      {
        sectionId: d4Main.id,
        name: "BB Overhead Squat",
        description:
          "Wide snatch grip. Bar overhead, sit deep. Requires thoracic mobility + ankle mobility.",
        sets: 4,
        reps: "6",
        order: 2,
      },
      {
        sectionId: d4Main.id,
        name: "BB Landmine (Rotational Press)",
        description:
          "Bar anchored in corner. Press and rotate. Control the eccentric.",
        sets: 3,
        reps: "10 each direction",
        order: 3,
      },
      {
        sectionId: d4Main.id,
        name: "One Arm One Leg Cable Row + Side Lunge",
        description:
          "Stand on one leg, row with same-side arm, then step into side lunge. Combines balance + pull + lateral movement.",
        sets: 3,
        reps: "6 each side",
        order: 4,
      },
    ],
  });

  // Day 4 - Accessory
  const d4Accessory = await prisma.section.create({
    data: {
      programDayId: day4.id,
      name: "Accessory Work",
      type: "accessory",
      order: 3,
      restSeconds: 60,
      notes: "Rest 60s between sets.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d4Accessory.id,
        name: "SA Overhead DB Lunge in Place",
        description:
          "Lock DB overhead with one arm, lunge with opposite leg. Switch arms each set.",
        sets: 3,
        reps: "10 each leg",
        order: 1,
      },
      {
        sectionId: d4Accessory.id,
        name: "Low to High Cable Chop",
        description:
          "Start low at hip, rotate and drive diagonally upward. Power comes from hips, not arms.",
        sets: 3,
        reps: "10 each side",
        order: 2,
      },
      {
        sectionId: d4Accessory.id,
        name: "Rotational Resist Complex",
        description:
          "Cable at chest height. Resist rotation while pressing out, rotating, and holding. 10 in/out + 10 rotations + 10s hold.",
        sets: 3,
        reps: "10 in/out + 10 rotations + 10s hold",
        order: 3,
      },
      {
        sectionId: d4Accessory.id,
        name: "DB Plank Row with Knee Tuck",
        description:
          "Plank position on DBs. Row one DB, then tuck same-side knee. Anti-rotation challenge.",
        sets: 3,
        reps: "6 each arm",
        order: 4,
      },
    ],
  });

  // Day 4 - Agility Finisher
  const d4Agility = await prisma.section.create({
    data: {
      programDayId: day4.id,
      name: "Agility Finisher",
      type: "agility",
      order: 4,
      notes: "Pick 2-3. Perform for 30-60 seconds each.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d4Agility.id,
        name: "Ladder Drills",
        description:
          "Single-leg hops, criss-cross hops, in-in-out-out.",
        sets: 1,
        reps: "30-60s",
        order: 1,
      },
      {
        sectionId: d4Agility.id,
        name: "Quadrant Jumps",
        description: "Hop between 4 squares in different patterns.",
        sets: 1,
        reps: "30-60s",
        order: 2,
      },
      {
        sectionId: d4Agility.id,
        name: "180 Jumps",
        description: "Squat jump with 180° rotation, land softly.",
        sets: 1,
        reps: "30-60s",
        order: 3,
      },
      {
        sectionId: d4Agility.id,
        name: "Clock Lunge Series",
        description:
          "Lunge to 12, 2, 3, 4, 6 o'clock positions.",
        sets: 1,
        reps: "30-60s",
        order: 4,
      },
    ],
  });

  // Day 4 - Cool-Down
  const d4Cooldown = await prisma.section.create({
    data: {
      programDayId: day4.id,
      name: "Cool-Down",
      type: "cooldown",
      order: 5,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: d4Cooldown.id,
        name: "Foam Roll: Full Body",
        description:
          "Calves, quads, hamstrings, TFL, IT bands, lats, thoracic spine. 45s each.",
        sets: 1,
        reps: "45s each",
        order: 1,
      },
      {
        sectionId: d4Cooldown.id,
        name: "90/90 Stretch",
        description: "30s each side.",
        sets: 1,
        reps: "30s each side",
        order: 2,
      },
      {
        sectionId: d4Cooldown.id,
        name: "Supine Hamstring Stretch with Strap",
        description: "30s each leg.",
        sets: 1,
        reps: "30s each leg",
        order: 3,
      },
      {
        sectionId: d4Cooldown.id,
        name: "Child's Pose with Reach Under",
        description: "30s each side.",
        sets: 1,
        reps: "30s each side",
        order: 4,
      },
      {
        sectionId: d4Cooldown.id,
        name: "Ankle Stretch",
        description: "Hang heels off step.",
        sets: 1,
        reps: "60s",
        order: 5,
      },
    ],
  });

  // ═══════════════════════════════════════════════════════
  // CARDIO PROGRAM: 3-Week Basketball Conditioning
  // ═══════════════════════════════════════════════════════
  const cardioProgram = await prisma.program.create({
    data: {
      name: "Basketball Cardio Program",
      description:
        "3-week cardiovascular training plan for basketball. Builds lactate threshold and sprint recovery speed. Stop hard training 4-5 days before game day.",
    },
  });

  // ─── Cardio Day 1: Steady-State Cardio ───
  const cDay1 = await prisma.programDay.create({
    data: {
      programId: cardioProgram.id,
      name: "Steady-State Cardio",
      focus: "Aerobic base, 65-70% max HR",
      dayNumber: 1,
      totalTime: "25-35 min",
    },
  });

  const c1Warmup = await prisma.section.create({
    data: {
      programDayId: cDay1.id,
      name: "Warm-Up",
      type: "activation",
      order: 1,
      restSeconds: 0,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: c1Warmup.id,
        name: "Light Jog or Brisk Walk",
        description: "Easy pace to raise heart rate gradually.",
        sets: 1,
        reps: "5 min",
        order: 1,
      },
    ],
  });

  const c1Main = await prisma.section.create({
    data: {
      programDayId: cDay1.id,
      name: "Main Work",
      type: "cardio",
      order: 2,
      notes:
        "Run, bike, or row. Keep heart rate at 65-70% max. Conversational pace — you should be able to talk.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: c1Main.id,
        name: "Steady-State Run / Bike / Row",
        description:
          "Maintain consistent pace at 65-70% max HR. Choose run, bike, or row based on joint comfort.",
        sets: 1,
        reps: "20-30 min",
        order: 1,
      },
    ],
  });

  const c1Cooldown = await prisma.section.create({
    data: {
      programDayId: cDay1.id,
      name: "Cool-Down",
      type: "cooldown",
      order: 3,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: c1Cooldown.id,
        name: "Walk + Light Stretching",
        description: "Easy walk, then stretch calves, quads, hip flexors.",
        sets: 1,
        reps: "5 min",
        order: 1,
      },
    ],
  });

  // ─── Cardio Day 2: Interval Training — Base ───
  const cDay2 = await prisma.programDay.create({
    data: {
      programId: cardioProgram.id,
      name: "Intervals — Base",
      focus: "Sprint capacity, lactate tolerance (Week 1 intensity)",
      dayNumber: 2,
      totalTime: "20-25 min",
    },
  });

  const c2Warmup = await prisma.section.create({
    data: {
      programDayId: cDay2.id,
      name: "Warm-Up",
      type: "activation",
      order: 1,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: c2Warmup.id,
        name: "Easy Jog + Dynamic Stretches",
        description:
          "5 min easy jog, then leg swings, high knees, butt kicks.",
        sets: 1,
        reps: "5 min",
        order: 1,
      },
    ],
  });

  const c2Main = await prisma.section.create({
    data: {
      programDayId: cDay2.id,
      name: "Intervals",
      type: "intervals",
      order: 2,
      restSeconds: 90,
      notes:
        "30 seconds at ~85-90% effort, then 90 seconds easy jog/walk recovery. 6-8 rounds.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: c2Main.id,
        name: "30s Hard / 90s Easy",
        description:
          "Sprint or hard effort for 30 seconds, then recover with easy jog or walk for 90 seconds. Repeat.",
        sets: 8,
        reps: "30s hard / 90s easy",
        order: 1,
      },
    ],
  });

  const c2Cooldown = await prisma.section.create({
    data: {
      programDayId: cDay2.id,
      name: "Cool-Down",
      type: "cooldown",
      order: 3,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: c2Cooldown.id,
        name: "Walk + Stretch",
        description: "5 min easy walk, then static stretches for legs.",
        sets: 1,
        reps: "5 min",
        order: 1,
      },
    ],
  });

  // ─── Cardio Day 3: Long Easy Run ───
  const cDay3 = await prisma.programDay.create({
    data: {
      programId: cardioProgram.id,
      name: "Long Easy Run",
      focus: "Aerobic endurance, fat oxidation",
      dayNumber: 3,
      totalTime: "35-45 min",
    },
  });

  const c3Main = await prisma.section.create({
    data: {
      programDayId: cDay3.id,
      name: "Main Work",
      type: "cardio",
      order: 1,
      notes:
        "Easy conversational pace. This builds aerobic base. Don't push — the intervals do the hard work.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: c3Main.id,
        name: "Easy Run",
        description:
          "30-40 minutes at easy, conversational pace. Walk breaks are fine if needed.",
        sets: 1,
        reps: "30-40 min",
        order: 1,
      },
    ],
  });

  const c3Cooldown = await prisma.section.create({
    data: {
      programDayId: cDay3.id,
      name: "Cool-Down",
      type: "cooldown",
      order: 2,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: c3Cooldown.id,
        name: "Walk + Full Lower Body Stretch",
        description:
          "5 min walk, then calves, quads, hamstrings, hip flexors, glutes. 30s each.",
        sets: 1,
        reps: "5 min walk + stretching",
        order: 1,
      },
    ],
  });

  // ─── Cardio Day 4: Intervals — Ramp ───
  const cDay4 = await prisma.programDay.create({
    data: {
      programId: cardioProgram.id,
      name: "Intervals — Ramp",
      focus: "Higher intensity intervals (Week 2 progression)",
      dayNumber: 4,
      totalTime: "25-30 min",
    },
  });

  const c4Warmup = await prisma.section.create({
    data: {
      programDayId: cDay4.id,
      name: "Warm-Up",
      type: "activation",
      order: 1,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: c4Warmup.id,
        name: "Easy Jog + Dynamic Stretches",
        description:
          "5 min easy jog, then leg swings, high knees, butt kicks.",
        sets: 1,
        reps: "5 min",
        order: 1,
      },
    ],
  });

  const c4Main = await prisma.section.create({
    data: {
      programDayId: cDay4.id,
      name: "Intervals",
      type: "intervals",
      order: 2,
      restSeconds: 80,
      notes:
        "40 seconds at ~85-90% effort, then 80 seconds easy recovery. 8-10 rounds. More work, less rest than Base intervals.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: c4Main.id,
        name: "40s Hard / 80s Easy",
        description:
          "Sprint or hard effort for 40 seconds, then recover for 80 seconds. Repeat. More aggressive than Base intervals.",
        sets: 10,
        reps: "40s hard / 80s easy",
        order: 1,
      },
    ],
  });

  const c4Cooldown = await prisma.section.create({
    data: {
      programDayId: cDay4.id,
      name: "Cool-Down",
      type: "cooldown",
      order: 3,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: c4Cooldown.id,
        name: "Walk + Stretch",
        description: "5 min easy walk, then static stretches.",
        sets: 1,
        reps: "5 min",
        order: 1,
      },
    ],
  });

  // ─── Cardio Day 5: Basketball Intervals ───
  const cDay5 = await prisma.programDay.create({
    data: {
      programId: cardioProgram.id,
      name: "Basketball Intervals",
      focus: "Sport-specific conditioning, court movement patterns",
      dayNumber: 5,
      totalTime: "25-30 min",
    },
  });

  const c5Warmup = await prisma.section.create({
    data: {
      programDayId: cDay5.id,
      name: "Warm-Up",
      type: "activation",
      order: 1,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: c5Warmup.id,
        name: "Light Jog + Lateral Shuffles",
        description:
          "3 min jog, then 2 min of lateral shuffles, backpedals, and defensive slides.",
        sets: 1,
        reps: "5 min",
        order: 1,
      },
    ],
  });

  const c5Main = await prisma.section.create({
    data: {
      programDayId: cDay5.id,
      name: "Basketball Drills",
      type: "intervals",
      order: 2,
      restSeconds: 90,
      notes:
        "Simulate game-like sprint patterns. Full effort on each rep, full recovery between sets.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: c5Main.id,
        name: "Suicide Sprints (Shuttle Runs)",
        description:
          "Baseline → free throw line → back → half court → back → far free throw → back → far baseline → back. All-out effort.",
        sets: 6,
        reps: "1 full suicide",
        order: 1,
      },
      {
        sectionId: c5Main.id,
        name: "Defensive Slide Shuttles",
        description:
          "Defensive stance, slide baseline to baseline. Stay low, quick feet. Alternate leading direction.",
        sets: 4,
        reps: "1 full court",
        order: 2,
      },
    ],
  });

  const c5Cooldown = await prisma.section.create({
    data: {
      programDayId: cDay5.id,
      name: "Cool-Down",
      type: "cooldown",
      order: 3,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: c5Cooldown.id,
        name: "Walk + Full Stretch",
        description:
          "Easy walk, then calves, quads, hamstrings, hip flexors, groin. 30s each.",
        sets: 1,
        reps: "5-10 min",
        order: 1,
      },
    ],
  });

  // ─── Cardio Day 6: Taper Jog ───
  const cDay6 = await prisma.programDay.create({
    data: {
      programId: cardioProgram.id,
      name: "Taper Jog",
      focus: "Active recovery, maintain without fatiguing (Week 3 taper)",
      dayNumber: 6,
      totalTime: "20-25 min",
    },
  });

  const c6Main = await prisma.section.create({
    data: {
      programDayId: cDay6.id,
      name: "Easy Jog",
      type: "cardio",
      order: 1,
      notes:
        "Very easy pace. This is about staying loose, not building fitness. If in doubt, go slower.",
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: c6Main.id,
        name: "Easy Jog",
        description:
          "20 minutes at very easy pace. This is active recovery — keep it light.",
        sets: 1,
        reps: "20 min",
        order: 1,
      },
    ],
  });

  const c6Cooldown = await prisma.section.create({
    data: {
      programDayId: cDay6.id,
      name: "Cool-Down",
      type: "cooldown",
      order: 2,
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sectionId: c6Cooldown.id,
        name: "Walk + Light Stretch",
        description: "Easy walk, gentle stretching. Stay loose.",
        sets: 1,
        reps: "5 min",
        order: 1,
      },
    ],
  });

  // ═══════════════════════════════════════════════════════
  // WEEKLY SCHEDULES (3-week combined calendar)
  // ═══════════════════════════════════════════════════════

  // Helper: dayOfWeek 1=Mon ... 7=Sun
  const MON = 1, TUE = 2, WED = 3, THU = 4, FRI = 5, SAT = 6, SUN = 7;

  // --- Week 1: Base Building ---
  const week1 = await prisma.weekSchedule.create({
    data: { weekNumber: 1, name: "Week 1 — Base Building", notes: "3x steady-state + 2x base intervals + 1x long run. All 4 lifting days." },
  });

  await prisma.scheduleEntry.createMany({
    data: [
      // Monday: Lower Strength + Steady-State
      { scheduleId: week1.id, dayOfWeek: MON, programDayId: day1.id, order: 1 },
      { scheduleId: week1.id, dayOfWeek: MON, programDayId: cDay1.id, order: 2, notes: "Cardio after lifting" },
      // Tuesday: Intervals Base (standalone)
      { scheduleId: week1.id, dayOfWeek: TUE, programDayId: cDay2.id, order: 1 },
      // Wednesday: Upper Body + Core + Steady-State
      { scheduleId: week1.id, dayOfWeek: WED, programDayId: day2.id, order: 1 },
      { scheduleId: week1.id, dayOfWeek: WED, programDayId: cDay1.id, order: 2, notes: "Cardio after lifting" },
      // Thursday: Rest
      { scheduleId: week1.id, dayOfWeek: THU, isRest: true, order: 1, notes: "Recovery day" },
      // Friday: Lower Power + Intervals Base
      { scheduleId: week1.id, dayOfWeek: FRI, programDayId: day3.id, order: 1 },
      { scheduleId: week1.id, dayOfWeek: FRI, programDayId: cDay2.id, order: 2, notes: "Cardio after lifting" },
      // Saturday: Athletic Full Body + Steady-State
      { scheduleId: week1.id, dayOfWeek: SAT, programDayId: day4.id, order: 1 },
      { scheduleId: week1.id, dayOfWeek: SAT, programDayId: cDay1.id, order: 2, notes: "Cardio after lifting" },
      // Sunday: Long Easy Run
      { scheduleId: week1.id, dayOfWeek: SUN, programDayId: cDay3.id, order: 1 },
    ],
  });

  // --- Week 2: Intensity Ramp ---
  const week2 = await prisma.weekSchedule.create({
    data: { weekNumber: 2, name: "Week 2 — Intensity Ramp", notes: "2x steady-state + 3x ramp intervals + 1x basketball intervals. All 4 lifting days." },
  });

  await prisma.scheduleEntry.createMany({
    data: [
      // Monday: Lower Strength + Steady-State
      { scheduleId: week2.id, dayOfWeek: MON, programDayId: day1.id, order: 1 },
      { scheduleId: week2.id, dayOfWeek: MON, programDayId: cDay1.id, order: 2, notes: "Cardio after lifting" },
      // Tuesday: Intervals Ramp (standalone)
      { scheduleId: week2.id, dayOfWeek: TUE, programDayId: cDay4.id, order: 1 },
      // Wednesday: Upper Body + Core + Intervals Ramp
      { scheduleId: week2.id, dayOfWeek: WED, programDayId: day2.id, order: 1 },
      { scheduleId: week2.id, dayOfWeek: WED, programDayId: cDay4.id, order: 2, notes: "Cardio after lifting" },
      // Thursday: Rest
      { scheduleId: week2.id, dayOfWeek: THU, isRest: true, order: 1, notes: "Recovery day" },
      // Friday: Lower Power + Basketball Intervals
      { scheduleId: week2.id, dayOfWeek: FRI, programDayId: day3.id, order: 1 },
      { scheduleId: week2.id, dayOfWeek: FRI, programDayId: cDay5.id, order: 2, notes: "Sport-specific conditioning after lifting" },
      // Saturday: Athletic Full Body + Steady-State
      { scheduleId: week2.id, dayOfWeek: SAT, programDayId: day4.id, order: 1 },
      { scheduleId: week2.id, dayOfWeek: SAT, programDayId: cDay1.id, order: 2, notes: "Cardio after lifting" },
      // Sunday: Intervals Ramp (standalone)
      { scheduleId: week2.id, dayOfWeek: SUN, programDayId: cDay4.id, order: 1 },
    ],
  });

  // --- Week 3: Peak + Taper ---
  const week3 = await prisma.weekSchedule.create({
    data: { weekNumber: 3, name: "Week 3 — Peak + Taper", notes: "2 lifting days only (Mon/Tue). 2x moderate intervals + 1x taper jog. Rest Thu-Sat. Game Sunday." },
  });

  await prisma.scheduleEntry.createMany({
    data: [
      // Monday: Lower Strength + Intervals Base (moderate effort)
      { scheduleId: week3.id, dayOfWeek: MON, programDayId: day1.id, order: 1 },
      { scheduleId: week3.id, dayOfWeek: MON, programDayId: cDay2.id, order: 2, notes: "Moderate effort — don't go all-out" },
      // Tuesday: Upper Body + Core + Intervals Base (moderate effort)
      { scheduleId: week3.id, dayOfWeek: TUE, programDayId: day2.id, order: 1 },
      { scheduleId: week3.id, dayOfWeek: TUE, programDayId: cDay2.id, order: 2, notes: "Moderate effort — last interval session" },
      // Wednesday: Taper Jog
      { scheduleId: week3.id, dayOfWeek: WED, programDayId: cDay6.id, order: 1 },
      // Thursday: Rest
      { scheduleId: week3.id, dayOfWeek: THU, isRest: true, order: 1, notes: "Recovery — fresh legs for game day" },
      // Friday: Rest
      { scheduleId: week3.id, dayOfWeek: FRI, isRest: true, order: 1, notes: "Rest or light walk" },
      // Saturday: Rest
      { scheduleId: week3.id, dayOfWeek: SAT, isRest: true, order: 1, notes: "Rest — stay off your feet" },
      // Sunday: Game Day
      { scheduleId: week3.id, dayOfWeek: SUN, isRest: true, order: 1, notes: "Game Day — fresh legs!" },
    ],
  });

  console.log("Seed complete!");
  console.log(`Program: ${program.name} (${program.id})`);
  console.log(`Days: ${[day1, day2, day3, day4].map((d) => d.name).join(", ")}`);
  console.log(`Program: ${cardioProgram.name} (${cardioProgram.id})`);
  console.log(
    `Days: ${[cDay1, cDay2, cDay3, cDay4, cDay5, cDay6].map((d) => d.name).join(", ")}`
  );
  console.log(`Schedules: ${[week1, week2, week3].map((w) => w.name).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
