# Nutritionist Requirements

## Nutritional Data

### Macronutrients (Per Serving)
- Calories (kcal)
- Protein (g)
- Carbohydrates (g)
  - Fiber (g)
  - Sugar (g)
- Fat (g)
  - Saturated (g)
  - Unsaturated (g)

### Micronutrients
- Vitamins: A, C, D, E, K, B-complex
- Minerals: Iron, Calcium, Potassium, Sodium

### Dietary Compatibility
- Vegetarian, Vegan
- Gluten-Free, Dairy-Free
- Keto-Friendly, Paleo

### Database Schema
```sql
CREATE TABLE recipe_nutrition (
  recipe_id UUID REFERENCES recipes(id),
  calories INTEGER,
  protein DECIMAL,
  carbs DECIMAL,
  fat DECIMAL,
  fiber DECIMAL,
  dietary_tags VARCHAR[]
);
```

### Features
- Filter by calorie range
- Search by nutritional goals
- Track daily nutrition
- View health benefits