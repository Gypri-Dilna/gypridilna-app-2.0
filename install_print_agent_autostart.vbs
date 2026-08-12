Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Get absolute path of print_agent.py in current folder
strCurrentDir = FSO.GetParentFolderName(WScript.ScriptFullName)
strScriptPath = strCurrentDir & "\print_agent.py"

If Not FSO.FileExists(strScriptPath) Then
    MsgBox "Soubor print_agent.py nebyl nalezen ve slozce: " & strCurrentDir, 16, "Chyba"
    WScript.Quit
End If

' Windows Startup Folder path
strStartupFolder = WshShell.SpecialFolders("Startup")
strTargetVbs = strStartupFolder & "\Gypri_PrintAgent_Silent.vbs"

' Write static silent launcher VBS into Windows Startup folder using clean ASCII strings
Set objFile = FSO.CreateTextFile(strTargetVbs, True, False)
objFile.WriteLine "Set WshShell = CreateObject(""WScript.Shell"")"
objFile.WriteLine "WshShell.Run ""pythonw.exe """"" & strScriptPath & """"", 0, False"
objFile.Close

MsgBox "Tiskovy agent byl uspesne pridan do Po spusteni (Startup) v systemu Windows!" & vbCrLf & vbCrLf & "Bude se spoustet automaticky na pozadi bez zobrazeni terminalu. V pripade chyby ovladace tiskarny zobrazi vyskakovaci okno.", 64, "Gypri Dilna - Tiskovy Agent"
