-- Badge Definitions Seed (production-safe, always needed)
INSERT INTO badge_definitions (level, name, description, minimum_count, maximum_count, icon, accent_color, display_order) VALUES
(1, 'Cheers',           'A Core Value behaviour has been recognized.',              1,  2,    'star',    '#F59E0B', 1),
(2, 'Applause',         'The behaviour is being recognized repeatedly.',            3,  5,    'thumbs-up','#3B82F6', 2),
(3, 'Kudos',            'Strong recurring recognition.',                            6,  10,   'award',   '#7C3AED', 3),
(4, 'Spotlight',        'Consistent recognition for the Core Value.',              11,  15,   'zap',     '#EA580C', 4),
(5, 'Value Ambassador', 'Strong and sustained recognition for the Core Value.',   16,  NULL, 'trophy',  '#16A34A', 5)
ON CONFLICT (level) DO NOTHING;
