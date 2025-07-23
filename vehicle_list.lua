-- PASTE THE gg_boosting vehicle list directly in this file it will process all your active boosting vehicles.
cfg = cfg or {} cfg.vehicles = cfg.vehicles or {}


cfg.vehicles.classes = {
    ["S"] = {
        payout = {min = 200, max = 500},
        class_timer = {min = 6, max = 12},    -- Hours
        
    },
    ["A"] = {
        payout = {min = 200, max = 500},
        class_timer = {min = 6, max = 12},    -- Hours
        
    },
    ["B"] = {
        payout = {min = 200, max = 500},
        class_timer = {min = 6, max = 12},    -- Hours
        
    },
    ["C"] = {
        payout = {min = 200, max = 500},
        class_timer = {min = 6, max = 12},    -- Hours
        
    },
    ["D"] = {
        payout = {min = 200, max = 500},
        class_timer = {min = 6, max = 12},    -- Hours

    },
}

cfg.vehicles.contracts = {
    {
        vehicle = 'adder',
        class = 'S',
        color = {primary = 70, secondary = 111}, -- Metallic Orange / Lava Red
    },
    {
        vehicle = 't20',
        class = 'S',
        color = {primary = 111, secondary = 135}, -- Lava Red / Midnight Blue
    },
    {
        vehicle = 'italirsx',
        class = 'S',
        color = {primary = 64, secondary = 137}, -- Racing Blue / Wine Red
    },
    {
        vehicle = 'tyrant',
        class = 'S',
        color = {primary = 138, secondary = 110}, -- Orange / Garnet Red
    },
    {
        vehicle = 'zentorno',
        class = 'A',
        color = {primary = 89, secondary = 92}, -- Hot Pink / Salmon Pink
    },
    {
        vehicle = 'banshee2',
        class = 'A',
        color = {primary = 86, secondary = 66}, -- Bright Purple / Galaxy Blue
    },
    {
        vehicle = 'comet6',
        class = 'A',
        color = {primary = 39, secondary = 135}, -- Dark Green / Midnight Blue
    },
    {
        vehicle = 'locust',
        class = 'A',
        color = {primary = 111, secondary = 28}, -- Lava Red / Taxi Yellow
    },
    {
        vehicle = 'drafter',
        class = 'B',
        color = {primary = 0, secondary = 0}, -- Black / Black
    },
    {
        vehicle = 'futo',
        class = 'B',
        color = {primary = 4, secondary = 4}, -- Silver / Silver
    },
    {
        vehicle = 'sentinelsg4',
        class = 'B',
        color = {primary = 5, secondary = 5}, -- Blue / Blue
    },
    {
        vehicle = 'penumbra2',
        class = 'B',
        color = {primary = 8, secondary = 8}, -- Olive Green / Olive Green
    },
    {
        vehicle = 'prairie',
        class = 'C',
        color = {primary = 1, secondary = 1}, -- White / White
    },
    {
        vehicle = 'issi2',
        class = 'C',
        color = {primary = 3, secondary = 3}, -- Cream / Cream
    },
    {
        vehicle = 'blista',
        class = 'C',
        color = {primary = 2, secondary = 2}, -- Gray / Gray
    },
    {
        vehicle = 'asea',
        class = 'C',
        color = {primary = 6, secondary = 6}, -- Dark Blue / Dark Blue
    },
    {
        vehicle = 'regina',
        class = 'D',
        color = {primary = 0, secondary = 0}, -- Black / Black
    },
    {
        vehicle = 'stanier',
        class = 'D',
        color = {primary = 2, secondary = 2}, -- Gray / Gray
    },
    {
        vehicle = 'intruder',
        class = 'D',
        color = {primary = 3, secondary = 3}, -- Cream / Cream
    },
    {
        vehicle = 'emperor',
        class = 'D',
        color = {primary = 1, secondary = 1}, -- White / White
    },
}





