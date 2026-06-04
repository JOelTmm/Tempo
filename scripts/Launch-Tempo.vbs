' Lance Tempo sans fermer immediatement en cas d'erreur
Option Explicit
Dim sh, fso, root, electron, indexHtml, r

Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(WScript.ScriptFullName)
root = fso.GetParentFolderName(root)

sh.CurrentDirectory = root
indexHtml = root & "\dist\index.html"
electron = root & "\node_modules\electron\dist\electron.exe"

If Not fso.FileExists(indexHtml) Then
  r = sh.Run("cmd /c npm.cmd run build", 1, True)
  If r <> 0 Then
    MsgBox "Echec compilation Tempo. Ouvrez PowerShell dans:" & vbCrLf & root & vbCrLf & "puis tapez: npm run build", 16, "Tempo"
    WScript.Quit 1
  End If
End If

If Not fso.FileExists(root & "\dist-electron\main.cjs") Then
  r = sh.Run("cmd /c npm.cmd run build:electron", 1, True)
  If r <> 0 Then
    MsgBox "Echec build Electron.", 16, "Tempo"
    WScript.Quit 1
  End If
End If

If Not fso.FileExists(electron) Then
  MsgBox "Electron manquant. Dans un terminal:" & vbCrLf & "cd " & root & vbCrLf & "npm install", 16, "Tempo"
  WScript.Quit 1
End If

sh.Environment("Process")("NODE_ENV") = "production"
' 1 = fenetre normale, False = ne pas attendre la fin
sh.Run """" & electron & """ """ & root & """", 1, False