#!/usr/bin/env node

const chalk = require('chalk')
const clear = require('clear')
const inquirer = require('inquirer')
const figlet = require('figlet')
const shell = require('shelljs')
const fs = require('fs')

clear()
console.log(
  chalk.red(
    figlet.textSync('MOGD', {horizontalLayout: 'fitted'})
  )
)

console.log(
  chalk.green('Welcome to MOGD! A backup and restore solution for Mongodb')
)

const initQuestions = [
  {
    type: 'list',
    name: 'action',
    message: 'Please select an action',
    choices: ['Backup', 'Restore'],
    default: 'Backup'
  }
]

const restoreQuestions = [
  {
    type: 'input',
    name: 'host',
    message: 'Hostname',
    default: 'localhost'
  },
  {
    type: 'input',
    name: 'port',
    message: 'Port',
    default: '27017'
  },
  {
    type: 'input',
    name: 'database',
    message: 'Database name',
    validate: (input) => {
      return new Promise((resolve, reject) => {
        if (!input.length) {
          reject('Please provide a database name')
        }
        resolve(true)
      })
    }
  },
  {
    type: 'input',
    name: 'collection',
    message: 'Collection name',
    validate: (input) => {
      return new Promise((resolve, reject) => {
        if (!input.length) {
          reject('Please provide a collection name')
        }
        resolve(true)
      })
    }
  },
  {
    type: 'input',
    name: 'source',
    message: 'Source directory'
  }
]

const backupQuestions = [
    {
      type: 'input',
      name: 'host',
      message: 'Hostname',
      default: 'localhost'
    },
    {
      type: 'input',
      name: 'port',
      message: 'Port',
      default: '27017'
    },
    {
      type: 'input',
      name: 'database',
      message: 'Database name',
      validate: (input) => {
        return new Promise((resolve, reject) => {
          if (!input.length) {
            reject('Please provide a database name')
          }
          resolve(true)
        })
      }
    },
    {
      type: 'input',
      name: 'collection',
      message: 'Collection name',
      validate: (input) => {
        return new Promise((resolve, reject) => {
          if (!input.length) {
            reject('Please provide a collection name')
          }
          resolve(true)
        })
      }
    },
    {
      type: 'input',
      name: 'output',
      message: 'Output directory',
      default: `${process.cwd()}/dump`
    }
  ]

;(async () => {
  this.restore = restore
  this.backup = backup

  const backupRestore = await inquirer.prompt(initQuestions)

  await this[backupRestore.action.toLowerCase()]()

  async function restore () {
    setDefaultValues()

    const {host, port, database, collection, source} = await inquirer.prompt(restoreQuestions)

    let command = ['mongorestore']

    host && (command = command.concat(['-h', host]))
    port && (command = command.concat(['-p', port]))
    database && (command = command.concat(['-d', database]))
    collection && (command = command.concat(['-c', collection]))
    source && (command = command.concat([source])) // this should be the last argument

    shell.echo(`\n`)

    try {
      await shell.exec(command.join(' '))
      shell.echo(`${chalk.green('BYEE')}`)
    } catch (e) {
      shell.echo(`${chalk.green(e)}`)
      shell.exit(0)
    }
  }

  async function backup () {
    const {host, port, database, collection, output} = await inquirer.prompt(backupQuestions)

    let command = ['mongodump']

    host && (command = command.concat(['-h', host]))
    port && (command = command.concat(['-p', port]))
    database && (command = command.concat(['-d', database]))
    collection && (command = command.concat(['-c', collection]))
    output && (command = command.concat(['-o', output]))

    shell.echo(`\n`)

    try {
      await shell.exec(command.join(' '))
      shell.echo(`${chalk.green('BYEE')}`)
    } catch (e) {
      shell.echo(`${chalk.green(e)}`)
      shell.exit(0)
    }
  }

  async function setDefaultValues () {
    const path = [process.cwd(), '/dump']
    const dumpFolderExists = fs.existsSync(path.join(''))

    if (!dumpFolderExists) {
      return
    }

    const dumpDir = fs.readdirSync(path.join(''))

    if (!dumpDir.length) {
      return
    }

    path.push(`/${dumpDir[0]}`)

    const dbSubFolders = fs.readdirSync(path.join(''))

    if (!dbSubFolders.length) {
      return
    }

    const dbIndex = restoreQuestions.findIndex(question => question.name === 'database')
    const collectionIndex = restoreQuestions.findIndex(question => question.name === 'collection')
    const sourceIndex = restoreQuestions.findIndex(question => question.name === 'source')

    const collection = dbSubFolders[0].split('.')[0] // test.bson => test
    const db = dumpDir[0]
    const source = `${process.cwd()}/dump/${db}/${collection}.bson`

    restoreQuestions[dbIndex]['default'] = db
    restoreQuestions[collectionIndex]['default'] = collection
    restoreQuestions[sourceIndex]['default'] = source

    delete restoreQuestions[dbIndex]['validate']
    delete restoreQuestions[collectionIndex]['validate']
  }
})()
