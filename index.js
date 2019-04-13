#!/usr/bin/env node
const request = require('request')
const meow = require('meow')
var jsdom = require('jsdom')
const { JSDOM } = jsdom
const { window } = new JSDOM()

var $ = (jQuery = require('jquery')(window))

const createUrl = (location = '', differenceLocation = '') => {
  const baseUrl = 'http://www.google.com/search?q='
  return (
    baseUrl +
    (differenceLocation
      ? 'time+difference+in+' +
        location.replace(' ', '+') +
        '+from+' +
        difference.replace(' ', '+')
      : 'time+in+' + location.replace(' ', '+'))
  )
}

const makeRequest = (options, { d: difference }) => {
  request(options, (err, _, result) => {
    try {
      if (err) {
        console.log('No results found.')
      } else {
        if (difference) {
          const resultContainer = $($.parseHTML(result)).find('div.vk_c.vk_gy')
          const childDivs = resultContainer.find('div')
          const dates = $(childDivs.get(1))
          const difference = childDivs.get(0).textContent.trim()
          console.log(dates.html())
          const first = {
            time: dates.find('b').get(0).textContent,
            day: dates.find('span').get(0).textContent,
            location: dates.find('div span').get(1)
              ? dates.find('div').get(1).textContent
              : dates
                .html()
                .split(', ')[1]
                .split('<')[0]
                .trim()
          }

          const second = {
            time: dates.find('div b').get(0).textContent,
            day: dates.find('div span').get(0).textContent,
            location: dates.find('div span').get(1)
              ? dates.find('div span').get(1)
              : dates
                .html()
                .split(', ')[2]
                .split('<')[0]
                .trim()
          }

          const showLocation = first.location || second.location
          const location = l => `, in ${l}`
          console.log(
            `${difference}\n${first.time} ${first.day}${showLocation &&
              location(first.location)}\n${second.time} ${
              second.day
            }${showLocation && location(second.location)}`
          )
        } else {
          const resultContainer = $($.parseHTML(result)).find('div.vk_c.vk_gy')
          const spans = resultContainer.find('span')

          const time = resultContainer.find('div.gsrt').get(0).textContent
          const day = resultContainer
            .find('div.vk_gy')
            .get(0)
            .textContent.split(',')[0]
            .trim()
          const date = spans.get(0).textContent
          const timezone = spans.get(1).textContent.trim()
          const location = spans.get(2)
            ? spans.get(2).textContent.split('Time in ')[1]
            : ''
          const formattedDateTime = `${location}${location &&
            '\n'}${time} ${timezone}\n${day}, ${date}`
          console.log(formattedDateTime)
        }
      }
    } catch (exception) {
      console.log(exception)
      cli.showHelp()
    }
  })
}

const cli = meow(
  `
    Usage
        parsed timein <input>

    Options
        -d, --difference <"2nd loc">    (Requires quotes) Get the time difference between two locations
        -p, --proxy                     Set your proxy
        -h, --help                      Display helpful information
        -r, --remote                    Forces a remote search (don't use the local tz database)
`,
  {
    alias: {
      d: '--difference',
      p: '--proxy',
      h: '--help',
      r: '--remote'
    }
  }
)

const remoteLookup = cli => {
  const location = cli.input.join(' ')
  const difference = cli.flags.d
  const url = createUrl(location, difference)
  const options = Object.assign(
    {
      url,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
      }
    },
    cli.flags.p && { proxy: cli.flags.p }
  )

  makeRequest(options, cli.flags)
}

const moment = require('moment-timezone')

const showTimeForZone = zone => {
  var date = moment().tz(zone)
  formatAndDisplayDate(date, zone)
  return true
}

const formatAndDisplayDate = (date, zone) => {
  var time = date.format('LT dddd, LL Z')
  var location = zone
    .split('/')
    .reverse()
    .join(', ')
  console.log(`parsed{location} \nparsed{time}`)
  return true
}

const localLookup = cli => {
  var { input, flags } = cli

  // Local Lookup doesn't support options
  if (Object.keys(flags).length !== 0) {
    return false
  }

  const tz = moment.tz

  var found = {}

  // Try to build a timezone name
  for (var name in tz._names) {
    var zone = tz._names[name]

    var zone_components = zone.toLowerCase().split('/')
    var name_components = name.toLowerCase().split('_')

    var combined_components = zone_components.concat(name_components)

    var matches = 0.0

    for (var i in input) {
      var key = input[i].toLowerCase()

      if (combined_components.indexOf(key) !== -1) {
        matches += 1.0
      }

      for (var i in combined_components) {
        var component = combined_components[i]
        if (component.indexOf(key) !== -1) {
          matches += parseFloat(key.length) / parseFloat(component.length)
          break
        }
      }
    }

    if (matches !== 0.0) {
      found[zone] = matches
    }
  }

  if (Object.keys(found).length === 0) {
    return false
  }

  var topZone = false
  var topZoneScore = 0

  for (var zone in found) {
    var score = found[zone]
    if (score > topZoneScore && score > 1.0) {
      topZone = zone
      topZoneScore = score
    }
  }

  if (topZone === false) {
    return false
  }

  return showTimeForZone(topZone)
}

var result = localLookup(cli)

if (!result) {
  remoteLookup(cli)
}

console.log('hello')
