#!/usr/bin/env node

const axios = require('axios')
require('dotenv').config()

const commands = [
    {
        "name": "timestamp",
        "type": 1,
        "description": "Convert a date and time to a Discord timestamp",
        "options": [
            {
                "name": "type",
                "description": "Output type",
                "type": 3,
                "required": true,
                "choices": [
                    {
                        "name": "Long date and time (January 1, 2022 11:11AM)",
                        "value": "F"
                    },
                    {
                        "name": "Long date (January 1, 2022)",
                        "value": "D"
                    },
                    {
                        "name": "Short date (1/1/2022)",
                        "value": "d"
                    },
                    {
                        "name": "Time (11:11 AM)",
                        "value": "t"
                    },
                    {
                        "name": "Relative (in 3 days)",
                        "value": "R"
                    },
                ]
            },
            {
                "name": "time",
                "description": "Date/time to convert to a timestamp",
                "type": 3,
                "required": true
            }
        ]
    },
    {
        "name": "stamp",
        "type": 1,
        "description": "Stamp commands that only respond to you",
        "options": [
            {
                "name": "configure",
                "description": "Set default timezone and date format",
                "type": 1,
                "options": [
                    {
                        "name": "timezone",
                        "description": "Timezone name (EST) or GMT offset (GMT-05:00)",
                        "type": 3,
                        "required": true
                    },
                    {
                        "name": "date_format",
                        "description": "Does the date come first or the month?",
                        "type": 3,
                        "required": true,
                        "choices": [
                            {
                                "name": "Month/Day/Year",
                                "value": "MDY"
                            },
                            {
                                "name": "Day/Month/Year",
                                "value": "DMY"
                            }
                        ]
                    }
                ]
            },
            {
                "name": "generate",
                "description": "Generate a timestamp string for copy/pasting elsewhere",
                "type": 1,
                "options": [
                    {
                        "name": "type",
                        "description": "Output type",
                        "type": 3,
                        "required": true,
                        "choices": [
                            {
                                "name": "Long date and time (January 1, 2022 11:11AM)",
                                "value": "F"
                            },
                            {
                                "name": "Long date (January 1, 2022)",
                                "value": "D"
                            },
                            {
                                "name": "Short date (1/1/2022)",
                                "value": "d"
                            },
                            {
                                "name": "Time (11:11 AM)",
                                "value": "t"
                            },
                            {
                                "name": "Relative (in 3 days)",
                                "value": "R"
                            },
                        ]
                    },
                    {
                        "name": "time",
                        "description": "Date/time to convert to a timestamp",
                        "type": 3,
                        "required": true
                    }
                ]
            },
            {
                "name": "help",
                "description": "Stamp commands reference",
                "type": 1
            },
        ]
    }
]

const url = `https://discord.com/api/v8/applications/${process.env.DISCORD_APP_ID}/commands`

commands.forEach(command => {
    axios.post(url, command, {headers: {"Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`}})
        .then(response => {
            console.log(`Added /${command.name}`)
        })
        .catch(reason => {
            console.error(JSON.stringify(reason.response.data))
        })
})

