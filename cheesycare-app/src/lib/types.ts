export type Team = {
  id: string;
  number: string;
  name: string;
  next_match_time?: string;
  description?: string;
  website?: string;
  created_at?: string;
};

export type TeamRedFlag = {
  id: string;
  team_id: string;
  flag: string;
  created_at?: string;
};

export type Person = {
  id: string;
  name: string;
  role?: string;
  status_type: 'team' | 'free' | 'assistance';
  status_team_id?: string;
  years_of_experience?: number;
  created_at?: string;
  // Joined data from queries
  status_team?: Team;
  skills?: Skill[];
  activities?: PersonActivity[];
};

export type Skill = {
  id: string;
  name: string;
};

export type ToolCategory = {
  id: string;
  name: string;
};

export type Tool = {
  id: string;
  name: string;
  category_id: string;
  category?: string;
  total_quantity: number;
  available_quantity: number;
  created_at?: string;
};

export type ToolCheckout = {
  id: string;
  tool_id: string;
  person_id: string;
  team_id?: string;
  quantity: number;
  checkout_time: string;
  expected_return_time?: string;
  actual_return_time?: string;
  notes?: string;
  is_active: boolean;
  person?: Person;
  team?: Team;
};

export type ToolWithCheckouts = Tool & {
  checkouts: (ToolCheckout & {
    person: Person;
    team?: Team;
  })[];
};

export type ToolHistory = {
  id: string;
  tool_id: string;
  action: 'checkout' | 'return' | 'maintenance';
  timestamp: string;
  person_id?: string;
  team_id?: string;
  notes?: string;
  // Joined data
  person?: Person;
  team?: Team;
};

export type Document = {
  id: string;
  title: string;
  category: 'SW' | 'AnW';
  summary?: string;
  link: string;
  created_at?: string;
};

export type DocumentKeyword = {
  id: string;
  document_id: string;
  keyword: string;
};

export type TeamNote = {
  id: string;
  team_id: string;
  content: string;
  created_by?: string;
  created_at: string;
  creator?: Person;
};

export type PersonActivity = {
  id: string;
  person_id: string;
  activity_type: 'team_assignment' | 'tool_checkout' | 'doc_contribution' | 'note_added' | 'match_participation';
  details: string;
  timestamp: string;
  target_id?: string;
  target_type?: string;
  link?: string;
};

export type Match = {
  id: string;
  match_number: string;
  match_time?: string;
  created_at?: string;
};

export type TeamMatch = {
  id: string;
  team_id: string;
  match_id: string;
  alliance: 'red' | 'blue';
  position: number;
  team?: Team;
}; 