-- Set Variable remove_images_on_start false to stop images being removed from processor on resource start.

local remove_images_on_start = true
if not remove_images_on_start then return end

local resName = GetCurrentResourceName()
local imageDir = GetResourcePath(resName) .. "/images"

local function getFiles(path)
    local files = {}
    local windows = string.match(os.getenv("OS") or "", "Windows")
    local command = ('%s "%s" %s'):format(
        windows and "dir" or "ls",
        path:gsub("\\", "/"),
        windows and "/b" or ""
    )

    local handle = io.popen(command)
    if not handle then return files end

    for line in handle:lines() do
        if line ~= "." and line ~= ".." and line ~= "desktop.ini" and not line:match("^%s*$") then
            table.insert(files, line)
        end
    end

    handle:close()
    return files
end

CreateThread(function()
    Wait(500)

    local files = getFiles(imageDir)
    local count = 0

    for _, file in ipairs(files) do
        if file:sub(-4):lower() == ".png" then
            os.remove(imageDir .. "/" .. file)
            count = count + 1
        end
    end

    if count <= 0 then return end
    print(("[gg_imageprocessor] Cleared %d PNG(s) from images/ folder"):format(count))
end)
