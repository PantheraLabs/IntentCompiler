# Cooking Instructor Requirements

## Instruction Format

### Step Structure
- Step Number
- Phase (Prep/Cook/Plate/Serve)
- Instruction (clear, action-oriented)
- Duration (minutes)
- Temperature (if applicable)
- Technique
- Visual Cue

### Example
```
Step 3 (Cook):
"Heat olive oil over medium heat (350°F). 
Add onions and sauté 5-7 minutes until golden."

Technique: Sautéing
Visual Cue: Translucent and caramelized
Equipment: Large skillet, wooden spoon
```

### Database Schema
```sql
CREATE TABLE recipe_steps (
  recipe_id UUID REFERENCES recipes(id),
  step_number INTEGER,
  phase VARCHAR(20),
  instruction TEXT,
  duration_minutes INTEGER,
  temperature VARCHAR(50),
  technique VARCHAR(100)
);
```

### Features
- Step-by-step cooking mode
- Timer integration
- Technique glossary
- Equipment substitutions