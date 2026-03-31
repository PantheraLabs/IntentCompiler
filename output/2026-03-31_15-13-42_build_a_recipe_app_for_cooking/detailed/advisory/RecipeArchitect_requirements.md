# Recipe Architect Requirements

## Recipe Data Structure

### Core Fields
- Title, Description
- Prep Time, Cook Time, Total Time
- Servings, Difficulty Level
- Cuisine Type, Dietary Tags

### Ingredient Organization
1. **Main Ingredients** - Primary components
2. **Secondary Ingredients** - Supporting items
3. **Seasonings** - Spices and herbs
4. **Garnish** - Final touches

### Cooking Flow
Prep → Cook → Plate → Serve

### Database Schema
```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER,
  difficulty VARCHAR(20),
  cuisine_type VARCHAR[],
  dietary_tags VARCHAR[]
);

CREATE TABLE recipe_ingredients (
  recipe_id UUID REFERENCES recipes(id),
  ingredient_id UUID,
  quantity DECIMAL,
  unit VARCHAR(50),
  category VARCHAR(50)
);
```

### Key Requirements
- Scalable servings (2x, 0.5x)
- Search by ingredients
- Filter by dietary restrictions
- Save favorites
- Rate and review

This structure ensures recipes are practical and user-friendly.