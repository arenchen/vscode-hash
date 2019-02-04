// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { createHash } from 'crypto';
import * as HashType from './constants';
import { copy } from './clipboard';
import { crc32 } from './crc32';

const md5 = createHash('md5');
const sha1 = createHash('sha1');
const sha256 = createHash('sha256');
const sha512 = createHash('sha512');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-hash" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  for (const cmd of HashType.Commands) {
    context.subscriptions.push(vscode.commands.registerCommand(cmd, (editor, edit) => {
      getInput(cmd, editor, edit).then(hash => {
        copyHash(<string>hash);
      });
    }));
  }
  for (const cmd of HashType.TextEditorCommands) {
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(cmd, (editor, edit) => {
      getInput(cmd, editor, edit).then(hash => {
        copyHash(<string>hash);
      });
    }));
  }
}

// this method is called when your extension is deactivated
export function deactivate() { }

async function getInput(hashType: string, editor: any, edit: any) {
  if (editor && editor.selection !== undefined) {
    const lsHash: string[] = [];

    for (const selection of editor.selections) {
      const range = new vscode.Range(selection.start, selection.end);
      const text = editor.document.getText(range);
      const hash = getHash(hashType, text);

      if (isNullOrWhiteSpace(hash)) {
        continue;
      }

      lsHash.push(getHash(hashType, text));
    }

    const result = lsHash.join('\n');

    return Promise.resolve(result);
  }

  const input = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    placeHolder: 'enter some value',
    prompt: 'Get a Hash',
    validateInput: value_1 => {
      if (isNullOrWhiteSpace(value_1)) {
        return 'You must enter some value';
      }
      else {
        return undefined;
      }
    }
  });
  return getHash(hashType, input);
}

function getHash(hashType: string, text?: string): string {
  let hash: string;

  if (isNullOrWhiteSpace(text)) { return ''; }

  switch (hashType) {
    case HashType.HASH_MD5:
    case HashType.HASH_MD5_EDITOR:
      md5.update(<string>text);
      hash = md5.digest('hex');
      break;
    case HashType.HASH_SHA1:
    case HashType.HASH_SHA1_EDITOR:
      sha1.update(<string>text);
      hash = sha1.digest('hex');
      break;
    case HashType.HASH_SHA256:
    case HashType.HASH_SHA256_EDITOR:
      sha256.update(<string>text);
      hash = sha256.digest('hex');
      break;
    case HashType.HASH_SHA512:
    case HashType.HASH_SHA512_EDITOR:
      sha512.update(<string>text);
      hash = sha512.digest('hex');
      break;
    case HashType.HASH_CRC32:
    case HashType.HASH_CRC32_EDITOR:
      hash = crc32(<string>text);
      break;
    default:
      console.log(hashType);
      break;
  }

  if (isNullOrWhiteSpace(hash!)) { return ''; }

  return hash!.toUpperCase();
}

function showMessage(hash: string) {
  if (isNullOrWhiteSpace(hash)) {
    return;
  }

  vscode.window.showInformationMessage(hash);
}

function copyHash(hash: string) {
  copy(hash, () => {
    showMessage(hash + ' is copied.');
  });
}

function isNullOrWhiteSpace(text: string | null | undefined) {
  return typeof text === 'string' && !text.trim() || typeof text === undefined || text === null;
}
