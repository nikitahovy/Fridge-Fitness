-- =============================================
-- Fridge Fitness — Supabase Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  household_size INTEGER DEFAULT 1,
  fitness_goal TEXT DEFAULT 'maintenance',
  dietary_preferences TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Inventory Items
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  location TEXT NOT NULL DEFAULT 'fridge',
  quantity TEXT DEFAULT '1',
  purchase_price NUMERIC(10,2) DEFAULT 0,
  purchase_date DATE DEFAULT CURRENT_DATE,
  best_by_date DATE,
  opened_at DATE,
  status TEXT NOT NULL DEFAULT 'active',
  nutrition_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own items" ON inventory_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own items" ON inventory_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own items" ON inventory_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own items" ON inventory_items FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_inventory_user_status ON inventory_items(user_id, status);

-- Shopping Carts
CREATE TABLE shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Cart',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own carts" ON shopping_carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own carts" ON shopping_carts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own carts" ON shopping_carts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own carts" ON shopping_carts FOR DELETE USING (auth.uid() = user_id);

-- Cart Items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  quantity TEXT DEFAULT '1',
  estimated_price NUMERIC(10,2) DEFAULT 0,
  from_recipe_id TEXT,
  checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own cart items" ON cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cart items" ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart items" ON cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cart items" ON cart_items FOR DELETE USING (auth.uid() = user_id);

-- Waste/Save tracking
CREATE TABLE food_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'consumed', 'discarded', 'frozen'
  item_name TEXT NOT NULL,
  dollar_value NUMERIC(10,2) DEFAULT 0,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE food_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own events" ON food_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON food_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_food_events_user ON food_events(user_id, occurred_at DESC);

-- Recovery preferences (mock WHOOP state per user)
CREATE TABLE recovery_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preset TEXT NOT NULL DEFAULT 'post-strength',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recovery_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own recovery" ON recovery_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own recovery" ON recovery_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recovery" ON recovery_state FOR UPDATE USING (auth.uid() = user_id);
