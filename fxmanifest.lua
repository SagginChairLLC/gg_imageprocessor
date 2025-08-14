fx_version 'cerulean'
game 'gta5'

author 'Ben'
description 'fivem-greenscreener'
version '1.6.5'

ui_page 'core/html/index.html'


files {
    'config.json',
    'core/html/*'
}

client_script {
    'core/client.js',
    'core/client.lua',
}

server_script 'core/server.js'

dependencies {
	'screenshot-basic',
    'yarn'
}
