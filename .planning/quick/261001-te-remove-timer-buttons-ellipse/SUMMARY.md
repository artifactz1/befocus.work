# 261001-te: Remove stray ellipse behind timer buttons

Root cause: TimerButtons wrapper had `rounded-full bg-card/50 backdrop-blur-md` + large shadow; Footer stretches it to ~11vh tall so it rendered as an ellipse. Removed the decoration, buttons unchanged.
