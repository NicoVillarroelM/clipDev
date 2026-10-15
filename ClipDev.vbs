Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\Nico\documents\proyectos\clipDev"
WshShell.Run "cmd /c pnpm electron .", 0, False
