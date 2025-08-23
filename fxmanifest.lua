fx_version 'cerulean' game 'gta5' author 'ggstudio' description 'gg_imageprocessor' version '1.0.0'

ui_page 'core/html/index.html'

shared_scripts {
    '@ox_lib/init.lua',
}

files {
    'core/html/*'
}

client_script {
    'core/client.js',
    'core/client.lua',
}

server_script {
    'core/server.js',
    'core/server.lua'
}

dependencies {
	'screenshot-basic',
    'yarn'
}

provides {
    'gg_imageprocessor'
}