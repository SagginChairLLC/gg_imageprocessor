fx_version 'cerulean'
game 'gta5'

author 'Ben'
description 'fivem-greenscreener'
version '1.6.5'

this_is_a_map 'yes'

ui_page 'html/index.html'

shared_scripts {
    'vehicle_list.lua',
}

files {
    'config.json',
    'html/*'
}

client_script {
    'client.js',
    'client.lua',
}

server_script 'server.js'

dependencies {
	'screenshot-basic',
    'yarn'
}
