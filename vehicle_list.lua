-- PASTE THE gg_boosting vehicle list directly in this file it will process all your active boosting vehicles.
cfg = cfg or {}

cfg.vehicle_classes = {
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

cfg.vehicles = {
    {
        vehicle = 'adder',
        class = 'S',
        colors = {primary = 28, secondary = 64},
    },
    {
        vehicle = 't20',
        class = 'S',
        colors = {primary = 3, secondary = 111},
    },
    {
        vehicle = 'italirsx',
        class = 'S',
        colors = {primary = 0, secondary = 120},
    },
    {
        vehicle = 'tyrant',
        class = 'S',
        colors = {primary = 8, secondary = 8},
    },
    {
        vehicle = 'zentorno',
        class = 'A',
        colors = {primary = 42, secondary = 0},
    },
    {
        vehicle = 'banshee2',
        class = 'A',
        colors = {primary = 59, secondary = 3},
    },
    {
        vehicle = 'comet6',
        class = 'A',
        colors = {primary = 111, secondary = 111},
    },
    {
        vehicle = 'locust',
        class = 'A',
        colors = {primary = 27, secondary = 94},
    },
    {
        vehicle = 'drafter',
        class = 'B',
        colors = {primary = 40, secondary = 41},
    },
    {
        vehicle = 'futo',
        class = 'B',
        colors = {primary = 0, secondary = 0},
    },
    {
        vehicle = 'sentinelsg4',
        class = 'B',
        colors = {primary = 13, secondary = 0},
    },
    {
        vehicle = 'penumbra2',
        class = 'B',
        colors = {primary = 88, secondary = 0},
    },
    {
        vehicle = 'prairie',
        class = 'C',
        colors = {primary = 29, secondary = 3},
    },
    {
        vehicle = 'issi2',
        class = 'C',
        colors = {primary = 112, secondary = 0},
    },
    {
        vehicle = 'blista',
        class = 'C',
        colors = {primary = 28, secondary = 12},
    },
    {
        vehicle = 'asea',
        class = 'C',
        colors = {primary = 15, secondary = 111},
    },
    {
        vehicle = 'regina',
        class = 'D',
        colors = {primary = 45, secondary = 20},
    },
    {
        vehicle = 'stanier',
        class = 'D',
        colors = {primary = 0, secondary = 0},
    },
    {
        vehicle = 'intruder',
        class = 'D',
        colors = {primary = 28, secondary = 4},
    },
    {
        vehicle = 'emperor',
        class = 'D',
        colors = {primary = 12, secondary = 28},
    },
}




