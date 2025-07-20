local vehicleData = exports.gg_boosting:GetVehicleData()

print(vehicleData)

while not cfg or not cfg.vehicles or not cfg.vehicle_colors do Wait(100) end

TriggerEvent('receiveConfig', cfg)

print("VEHICLE FILE LOADED")