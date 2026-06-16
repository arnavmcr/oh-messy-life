"""
Shared configuration for the Ticket Ticker pipeline.
Pure data — no logic. Imported by pipeline.py, cleanup.py, and utils.py.
"""

# ── Pipeline constants ─────────────────────────────────────────────────────────

CHUNK_SIZE = 30
MAX_RETRIES = 2
RETRY_DELAY = 5
SAVE_EVERY_N_CHUNKS = 3
MAX_MESSAGE_LENGTH = 500
MAX_TOKENS = 4096
MODEL = "claude-sonnet-4-6"

# ── Noise patterns (regex strings, compiled in utils.py) ───────────────────────

NOISE_PATTERNS_RAW = [
    r'joined using.*link',
    r'created this group',
    r'changed the group',
    r'added you',
    r'removed you',
    r'\bleft$',
    r'end-to-end encrypted',
    r'now an admin',
    r'omitted$',
    r'message was deleted',
    r'^\s*$',
    r'pinned a message',
]

# ── Festival map ───────────────────────────────────────────────────────────────
# Ordered list of (keyword, canonical_base, year_windows_key, needs_city).
# year_windows_key: "lolla" | "dgtl" | None
# needs_city: bool — whether to append a city inferred from CITY_MAP
#
# Order matters: more specific keywords must appear before shorter overlapping
# ones (e.g. "road to lollapalooza" before "lolla").

FESTIVAL_MAP = [
    # Road to Lolla — separate event, no year appended
    ("road to lollapalooza",  "Road to Lollapalooza",  None,    False),
    ("road to lolla",          "Road to Lollapalooza",  None,    False),
    # Lollapalooza — year inferred from LOLLA_WINDOWS
    ("lollapalooza",           "Lollapalooza",           "lolla", False),
    ("lolla",                  "Lollapalooza",           "lolla", False),
    # DGTL — year from DGTL_WINDOWS, city inferred
    ("dgtl",                   "DGTL",                   "dgtl",  True),
    # Multi-day festivals — city inferred where relevant
    ("sunburn",                "Sunburn",                None,    True),
    ("nh7 weekender",          "NH7 Weekender",          None,    True),
    ("nh7",                    "NH7 Weekender",          None,    True),
    ("weekender",              "NH7 Weekender",          None,    True),
    ("magnetic fields",        "Magnetic Fields",        None,    False),
    ("echoes of earth",        "Echoes of Earth",        None,    False),
    ("bandland",               "Bandland",               None,    False),
    # Club/rave events — city inferred
    ("zamna",                  "Zamna",                  None,    True),
    ("anjunadeep",             "Anjunadeep",             None,    True),
    ("circus festival",        "Circus Festival",        None,    True),
    ("circus",                 "Circus Festival",        None,    True),
    ("verknipt",               "Verknipt",               None,    True),
    # International tours / one-off shows with fixed city
    ("rolling loud",           "Rolling Loud",           None,    True),
    ("travis scott",           "Travis Scott",           None,    True),
    ("ed sheeran",             "Ed Sheeran",             None,    True),
    ("guns n' roses",          "Guns N' Roses",          None,    True),
    ("guns n roses",           "Guns N' Roses",          None,    True),
    ("metronomy",              "Metronomy",              None,    True),
    ("when chai met toast",    "When Chai Met Toast",    None,    True),
    # Co-headlining tours — must precede individual artist entries in ARTIST_MAP
    ("def leppard and scorpions", "Def Leppard & Scorpions", None, True),
    # Annual Indian festivals
    ("mahindra blues festival",   "Mahindra Blues Festival", None, False),
    ("mahindra blues",            "Mahindra Blues Festival", None, False),
    ("sounds good festival",      "Sounds Good Festival",    None, True),
    ("no art",                    "No Art",                  None, True),
]

# ── Artist map ─────────────────────────────────────────────────────────────────
# Ordered list of (keyword, canonical_name).
# City is always inferred from CITY_MAP applied to event name + original message.
# More specific phrases must precede single-word keywords.
# Known false-positive risks are commented.

ARTIST_MAP = [
    ("coldplay",               "Coldplay"),
    ("diljit dosanjh",         "Diljit Dosanjh"),
    ("diljit",                 "Diljit Dosanjh"),
    ("karan aujla",            "Karan Aujla"),
    ("ap dhillon",             "AP Dhillon"),
    ("eras tour",              "Taylor Swift"),
    ("taylor swift",           "Taylor Swift"),
    ("arijit singh",           "Arijit Singh"),
    ("arijit",                 "Arijit Singh"),
    ("ar rahman",              "A.R. Rahman"),
    ("nucleya",                "Nucleya"),
    ("prateek kuhad",          "Prateek Kuhad"),
    ("armin van buuren",       "Armin van Buuren"),
    ("armin",                  "Armin van Buuren"),   # false-positive risk: "Armin Kapoor"
    # International artists added from 2026 data
    ("john mayer",             "John Mayer"),
    ("anoushka shankar",       "Anoushka Shankar"),
    ("kanye west",             "Kanye West"),
    ("ye live",                "Kanye West"),          # "ye" alone too broad; use longer phrases
    ("ye - live",              "Kanye West"),
    ("def leppard",            "Def Leppard"),
    ("calvin harris",          "Calvin Harris"),
    ("keinemusik",             "Keinemusik"),
    ("mltr",                   "MLTR"),
    ("black coffee",           "Black Coffee"),
    ("scorpions",              "Scorpions"),
    ("baby j",                 "Baby J"),
    # Rishab Rikhiram Sharma — many spelling variants; tour name first, then name forms
    ("sitar for mental health","Rishab Rikhiram Sharma"),
    ("rishab rikhiram",        "Rishab Rikhiram Sharma"),
    ("rishabh rikhiram",       "Rishab Rikhiram Sharma"),
    ("rishab rikiram",         "Rishab Rikhiram Sharma"),
    ("rishabh rakhiram",       "Rishab Rikhiram Sharma"),
    ("rishab sharma",          "Rishab Rikhiram Sharma"),
    # Circoloco — two spellings in use
    ("circoloco",              "Circoloco"),
    ("circo loco",             "Circoloco"),
    # High false-positive risk — keep last so more specific entries match first
    ("fisher",                 "Fisher"),              # false-positive risk: "fisher price"
    ("king",                   "King"),                # false-positive risk: unrelated "king" uses
    ("sting",                  "Sting"),               # false-positive risk: "listing", "existing"
]

# ── City map ───────────────────────────────────────────────────────────────────
# keyword → canonical city name

CITY_MAP = {
    "Mumbai":    ["mumbai", "bombay", "bkc", "mmrda", "nmacc", "ncpa", "nsci"],
    "Delhi":     ["delhi", "ncr", "gurugram", "gurgaon", "noida"],
    "Bangalore": ["bangalore", "bengaluru", "blr"],
    "Ahmedabad": ["ahmedabad"],
    "Pune":      ["pune"],
    "Hyderabad": ["hyderabad"],
    "Chennai":   ["chennai"],
    "Kolkata":   ["kolkata"],
    "Goa":       ["goa"],
    "Jaipur":    ["jaipur"],
}

# ── Year-inference windows ─────────────────────────────────────────────────────
# List of (start_date, end_date, year_string) — message_date is the lookup key.

LOLLA_WINDOWS = [
    ("2023-01-01", "2024-02-01", "2024"),
    ("2024-02-01", "2025-08-01", "2025"),
    ("2025-08-01", "2026-08-01", "2026"),
    ("2026-08-01", "2027-08-01", "2027"),
]

DGTL_WINDOWS = [
    ("2022-01-01", "2024-01-01", "2024"),
    ("2024-01-01", "2025-01-01", "2025"),
    ("2025-01-01", "2026-01-01", "2026"),
]

# ── Multi-day event keywords ───────────────────────────────────────────────────
# Used by detect_pass_type — only these events get pass type analysis.

MULTI_DAY_EVENTS = [
    "lollapalooza",
    "lolla",
    "dgtl",
    "sunburn",
    "nh7",
    "weekender",
    "magnetic fields",
    "echoes of earth",
    "bandland",
]
