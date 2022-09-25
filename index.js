//modulos externos
import inquirer from 'inquirer'
import chalk from 'chalk'

//modulos internos
import * as fs from 'node:fs'

operation()

//Main menu
function operation() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'action',
        message: 'O que você deseja fazer?',
        choices: [
          'Criar conta',
          'Consultar Saldo',
          'Depositar',
          'Sacar',
          'Transferir',
          'Sair'
        ]
      }
    ])
    .then(answer => {
      const action = answer['action']

      if (action === 'Criar conta') {
        createAccount()
      } else if (action === 'Consultar Saldo') {
        checkBalance()
      } else if (action === 'Depositar') {
        deposit()
      } else if (action === 'Sacar') {
        withdraw()
      } else if (action === 'Transferir') {
        transfer()
      } else if (action === 'Sair') {
        console.log(chalk.bgBlue.black('Obrigada por usar o account!'))
        process.exit()
      }
    })
    .catch(err => console.log(err))
}

//Create account
function createAccount() {
  console.log(chalk.bgGreen.black('Parabéns por escolher nosso banco!'))
  console.log(chalk.green('Defina as opções da sua conta a seguir'))
  buildAccount()
}

function buildAccount() {
  inquirer
    .prompt([
      {
        name: 'accountName',
        message: 'Digite um nome para sua conta: '
      }
      // {
      //   type: 'checkbox',
      //   name: 'accountType',
      //   message: 'Escolha o tipo de conta: ',
      //   choices: ['Conta corrente', 'Conta poupança']
      // },
    ])
    .then(answer => {
      const accountName = answer['accountName']

      if (!fs.existsSync('accounts')) {
        fs.mkdirSync('accounts')
      }
      if (fs.existsSync(`accounts/${accountName}.json`)) {
        console.log(
          chalk.bgRed.black('Essa conta já existe, escolha outro nome')
        )
        buildAccount()
        return
      }

      fs.writeFileSync(
        `accounts/${accountName}.json`,
        '{"balance": 0}',
        function (err) {
          console.log(err)
        }
      )

      console.log(chalk.green(`Sua conta foi criada com o nome ${accountName}`))

      operation()
    })
    .catch(err => console.log(err))
}
// ==============================

//Check Balance
function checkBalance() {
  //Perguntar o nome da conta
  inquirer
    .prompt([getAccountName])
    .then(answer => {
      const accountName = answer['accountName']

      if (!checkAccout(accountName)) {
        checkBalance()
        return
      }

      //Resposta

      const accountData = getAccount(accountName)

      console.log(
        chalk.bgBlue.black(
          `Olá, o saldo da sua conta é de R$ ${accountData.balance}`
        )
      )

      operation()
      //Caso exista, lemos o arquivo para pegar o dado do saldo
    })
    .catch(err => console.log(err))
}
//===============================

//Deposit
function deposit() {
  inquirer
    .prompt([getAccountName])
    .then(answer => {
      //Resposta
      const accountName = answer['accountName']

      //Verificando se o nome fornecido de conta existe
      if (!checkAccout(accountName)) {
        deposit()
        return
      }

      inquirer
        .prompt([
          {
            name: 'amount',
            message: 'Digite o valor do depósito: '
          }
        ])
        .then(answer => {
          //add amount
          const amount = answer['amount']

          mathOperations(accountName, amount, 'add')
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}
//===============================

//Withdraw
function withdraw() {
  inquirer
    .prompt([getAccountName])
    .then(answer => {
      const accountName = answer['accountName']

      //Check if account exists
      if (!checkAccout(accountName)) {
        return withdraw()
      }

      //Get amount
      inquirer
        .prompt([
          {
            name: 'amount',
            message: 'Digite o valor do saque: '
          }
        ])
        .then(answer => {
          const amount = answer['amount']

          const accountData = getAccount(accountName)

          if (!checkAmount.available(amount, accountData)) {
            return withdraw()
          }

          mathOperations(accountName, amount, 'remove')
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}
// ==============================

//Transfer
function transfer() {
  inquirer
    .prompt([
      getAccountName,
      {
        name: 'destinationAccount',
        message: 'Para qual conta gostaria de transferir?'
      }
    ])
    .then(answer => {
      const accountName = answer['accountName']
      const destinationAccount = answer['destinationAccount']

      //Check if both accounts exists
      if (!checkAccout(accountName) || !checkAccout(destinationAccount)) {
        return transfer()
      }

      //Get amount
      inquirer
        .prompt([
          {
            name: 'amount',
            message: 'Digite o valor da transferência: '
          }
        ])
        .then(answer => {
          const amount = answer['amount']

          //Getting accounts data
          const accountData = getAccount(accountName)
          const destinatioAccountData = getAccount(destinationAccount)

          //Checking if the amount is available
          if (!checkAmount.available(amount, accountData)) {
            return transfer()
          }
          //Checking if there is an amount and if it´s a valid number
          if (!checkAmount.valid(amount)) {
            return transfer()
          }

          //Taking the money out of the account and saving
          accountData.balance =
            parseFloat(accountData.balance) - parseFloat(amount)
          updateFile(accountName, accountData)

          //Sending the money to the destination account and saving
          destinatioAccountData.balance =
            parseFloat(amount) + parseFloat(destinatioAccountData.balance)
          updateFile(destinationAccount, destinatioAccountData)

          console.log(
            chalk.green(
              `Você transferiu R$${amount} para ${destinationAccount}`
            )
          )

          operation()
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}

// Reusable functions/variables

function mathOperations(accountName, amount, op) {
  const accountData = getAccount(accountName)

  if (!checkAmount.valid(amount)) {
    return operation()
  }

  if (op === 'add') {
    accountData.balance = parseFloat(amount) + parseFloat(accountData.balance)
    console.log(
      chalk.green(`Foi depositado o valor de R$${amount} na sua conta!`)
    )
  } else if (op === 'remove') {
    accountData.balance = parseFloat(accountData.balance) - parseFloat(amount)
    console.log(chalk.green(`Foi realizado o saque no valor de R$${amount}`))
  }

  updateFile(accountName, accountData)

  operation()
}

function updateFile(accountName, accountData) {
  fs.writeFileSync(
    `accounts/${accountName}.json`,
    JSON.stringify(accountData),
    function (err) {
      console.log(err)
    }
  )
}

function checkAccout(accountName) {
  if (!fs.existsSync(`accounts/${accountName}.json`)) {
    console.log(chalk.bgRed.black('Essa conta não existe, escolha outro nome!'))
    return false
  }
  return true
}

const checkAmount = {
  valid(amount) {
    if (!amount || isNaN(amount)) {
      console.log(
        chalk.bgRed.black('Digite um número válido e tente novamente!')
      )
      // return operation()
      return false
    }
    return true
  },
  available(amount, accountData) {
    if (amount > accountData.balance) {
      console.log(
        chalk.bgRed.black(
          'Você não tem esse valor disponível na sua conta! Tente novamente'
        )
      )
      return false
    }
    return true
  }
}

function getAccount(accountName) {
  const accountJSON = fs.readFileSync(`accounts/${accountName}.json`, {
    encoding: 'utf8',
    flag: 'r'
  })

  return JSON.parse(accountJSON)
}

const getAccountName = {
  name: 'accountName',
  message: 'Qual o nome da sua conta?'
}


