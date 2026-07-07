import subprocess


class CompilerDiagnostics:

    def check(self, command):

        try:

            process = subprocess.run(

                command,

                capture_output=True,

                text=True,

                timeout=5,

            )

            version = (
                process.stdout.strip()
                or process.stderr.strip()
            )

            return {

                "installed": process.returncode == 0,

                "version": version,

            }

        except FileNotFoundError:

            return {

                "installed": False,

                "version": None,

            }

        except Exception:

            return {

                "installed": False,

                "version": None,

            }

    # ===============================================

    def python(self):

        return self.check(

            ["python", "--version"]

        )

    # ===============================================

    def gcc(self):

        return self.check(

            ["gcc", "--version"]

        )

    # ===============================================

    def gpp(self):

        return self.check(

            ["g++", "--version"]

        )

    # ===============================================

    def java(self):

        return self.check(

            ["java", "-version"]

        )

    # ===============================================

    def node(self):

        return self.check(

            ["node", "--version"]

        )

    # ===============================================

    def report(self):

        return {

            "python": self.python(),

            "gcc": self.gcc(),

            "g++": self.gpp(),

            "java": self.java(),

            "node": self.node(),

        }


compiler_diagnostics = CompilerDiagnostics()