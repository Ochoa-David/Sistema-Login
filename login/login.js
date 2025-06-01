document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos DOM
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm = document.getElementById('forgot-form');
    const recovery_passwordForm = document.getElementById('recovery_password-form');
    const com_passwordForm = document.getElementById('com_password-form');

    // Variable para almacenar el token actual
    let currentToken = '';

    // Enlaces para cambiar entre formularios
    document.getElementById('register-link').addEventListener('click', function(e) {
        e.preventDefault();
        showForm(registerForm);
    });
    
    // Usar querySelectorAll para todos los enlaces de login (ID y clase común)
    document.querySelectorAll('#login-link, .login-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showForm(loginForm);
        });
    });
    
    document.getElementById('forgot-password-link').addEventListener('click', function(e) {
        e.preventDefault();
        showForm(forgotForm);
    });

    // Manejo del formulario de solicitud de recuperación
    document.getElementById('form-forgot').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('forgot-email').value;
        
        // Validación del correo
        if (!email.trim()) {
            showError(forgotForm, '❌ Ingrese un correo electrónico');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError(forgotForm, '❌ Formato de correo inválido');
            return;
        }
        
        // Mostrar indicador de carga
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = "Procesando...";
        submitButton.disabled = true;
        
        // Llamada a la API para verificar el correo
        fetch('http://127.0.0.1:5000/recovery_password-rp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        })
        .then(response => response.json())
        .then(data => {
            // Restaurar el botón
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            if (data.success) {
                // Almacenar el correo para usarlo en la siguiente pantalla
                sessionStorage.setItem('recoveryEmail', email);
                
                showSuccess(forgotForm, '✅ Correo verificado');
                setTimeout(() => {
                    // Pre-llenar el email en el siguiente formulario
                    document.getElementById('recovery-email').value = email;
                    showForm(recovery_passwordForm);
                }, 1500);
            } else {
                showError(forgotForm, '❌ ' + (data.message || 'Correo no registrado'));
            }
        })
        .catch(error => {
            // Restaurar el botón por si
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            showError(forgotForm, '❌ Error en la conexión');
            console.error('Recovery email error:', error);
        });
    });

    // Funciones de manejo de formularios
    document.getElementById('form-login').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Guardar token en localStorage
                localStorage.setItem('authToken', data.token);
                
                // mostrar el token (por ahora)
                showGameLauncher(data.token);
            } else {
                showError(loginForm, data.message || 'Error de autenticación');
            }
        })
        .catch(error => {
            showError(loginForm, 'Error en la conexión');
            console.error('Login error:', error);
        });
    });
    
    document.getElementById('form-register').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        const securityQuestion = document.getElementById("register-securityQuestion").value;
        const securityAnswer = document.getElementById("register-securityAnswer").value;

        
        // Validar coincidencia de contraseñas
        if (password !== passwordConfirm) {
            showError(registerForm, 'Las contraseñas no coinciden');
            return;
        }
        if (!securityQuestion || !securityAnswer) {
            showError(registerForm, 'Debes seleccionar una pregunta de seguridad y responderla.');
            return;
        }
        
        // Llamada a la API para registrar usuario
        fetch('http://127.0.0.1:5000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, securityQuestion, securityAnswer })
        })
        
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess(registerForm, 'Registro exitoso. Ahora puedes iniciar sesión.');
                setTimeout(() => {
                    showForm(loginForm);
                }, 2000);
            } else {
                showError(registerForm, data.message || 'Error en el registro');
            }
        })
        .catch(error => {
            showError(registerForm, 'Error en la conexión');
            console.error('Register error:', error);
        });
    });
    
    document.getElementById('form-recovery_password').addEventListener('submit', function(e) {
        e.preventDefault();

        const username = document.getElementById('recovery-username').value;
        const email = document.getElementById('recovery-email').value;
        const securityQuestion = document.getElementById('recovery-securityQuestion').value;
        const securityAnswer = document.getElementById('recovery-securityAnswer').value;

        if (!username.trim()) {
            showError(recovery_passwordForm, '❌ Ingrese un nombre de usuario');
            return;
        }

        if (!email.trim()) {
            showError(recovery_passwordForm, '❌ Ingrese un correo electrónico');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError(recovery_passwordForm, '❌ Formato de correo inválido');
            return;
        }

        if (!securityQuestion) {
            showError(recovery_passwordForm, '❌ Seleccione una pregunta de seguridad');
            return;
        }

        if (!securityAnswer.trim()) {
            showError(recovery_passwordForm, '❌ Ingrese la respuesta de seguridad');
            return;
        }

        const recoveryEmail = sessionStorage.getItem('recoveryEmail');
        if (recoveryEmail && email !== recoveryEmail) {
            showError(recovery_passwordForm, '❌ El correo no coincide con el ingresado anteriormente');
            return;
        }

        // boton comprobar identidad
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = "Verificando...";
        submitButton.disabled = true;

        fetch('http://127.0.0.1:5000/com_password-cp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username,
                email,
                securityQuestion,
                securityAnswer
            })
        })
        .then(response => response.json())
        .then(data => {
            submitButton.textContent = originalText;
            submitButton.disabled = false;

            if (data.success) {
                if (data.resetToken) {
                    sessionStorage.setItem('resetToken', data.resetToken);
                }

                sessionStorage.setItem('recoveryEmail', email);

                showSuccess(recovery_passwordForm, '✅ Identidad verificada correctamente');

                setTimeout(() => {
                    showForm(com_passwordForm);
                }, 1500);
            } else {
                showError(recovery_passwordForm, '❌ ' + (data.message || 'Información incorrecta'));
            }
        })
        .catch(error => {
            submitButton.textContent = originalText;
            submitButton.disabled = false;

            showError(recovery_passwordForm, '❌ Error en la conexión');
            console.error('Identity verification error:', error);
        });
    });

    // Manejo del cambio de contraseña
    document.getElementById('form-change-password').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const resetToken = sessionStorage.getItem('resetToken');
        
        // Validaciones en el frontend
        if (!newPassword || !confirmPassword) {
            showError(com_passwordForm, '❌ Complete todos los campos');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showError(com_passwordForm, '❌ Las contraseñas no coinciden');
            return;
        }
        
        if (newPassword.length < 6) {
            showError(com_passwordForm, '❌ La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        if (!resetToken) {
            showError(com_passwordForm, '❌ Sesión expirada. Reinicie el proceso');
            setTimeout(() => {
                showForm(forgotForm);
            }, 2000);
            return;
        }
        
        // Mostrar indicador de carga
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = "Actualizando...";
        submitButton.disabled = true;
        
        // Enviar solicitud al servidor
        fetch('http://127.0.0.1:5000/change-password-final', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resetToken}`
            },
            body: JSON.stringify({
                newPassword: newPassword,
                confirmPassword: confirmPassword
            })
        })
        .then(response => response.json())
        .then(data => {
            // Restaurar el botón
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            if (data.success) {
                // Limpiar tokens de sesión
                sessionStorage.removeItem('resetToken');
                sessionStorage.removeItem('recoveryEmail');
                
                showSuccess(com_passwordForm, '✅ Contraseña actualizada correctamente');
                
                // Limpiar formularios
                document.getElementById('form-change-password').reset();
                document.getElementById('form-recovery_password').reset();
                
                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    showForm(loginForm);
                }, 2000);
                
            } else {
                showError(com_passwordForm, '❌ ' + (data.message || 'Error al actualizar contraseña'));
            }
        })
        .catch(error => {
            // Restaurar el botón en caso de error
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            showError(com_passwordForm, '❌ Error en la conexión');
            console.error('Change password error:', error);
        });
    });

    //token más corto y elegante
    function generateShortToken(email) {
        
        const timestamp = Date.now().toString(36); // Base36 
        const randomPart = Math.random().toString(36).substr(2, 6); // 6 caracteres aleatorios
        const emailHash = btoa(email).substr(0, 4); // Primeros 4 caracteres del email codificado
        
        // Formato XXXX-YYYY-ZZZZ
        const shortToken = `${emailHash.toUpperCase()}-${timestamp.toUpperCase()}-${randomPart.toUpperCase()}`;
        
        return shortToken;
    }

    // Funcionalidad de copiado del token
    const copyBtn = document.getElementById('copy-btn');
    const tokenDisplay = document.getElementById('token-display');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const tokenText = tokenDisplay.textContent;
            const feedback = document.getElementById('copy-feedback');
            
            try {
                await navigator.clipboard.writeText(tokenText);
                
                // Feedback visual
                copyBtn.textContent = '✓';
                copyBtn.style.backgroundColor = '#28a745';
                feedback.textContent = '¡Token copiado!';
                feedback.className = 'copy-feedback success';
                
                // Restaurar estado después de 2 segundos
                setTimeout(() => {
                    copyBtn.textContent = 'Copiar';
                    copyBtn.style.backgroundColor = '#6c757d';
                    feedback.textContent = '';
                    feedback.className = 'copy-feedback';
                }, 2000);
                
            } catch (err) {
                // Fallback para navegadores antiguos
                try {
                    const textArea = document.createElement('textarea');
                    textArea.value = tokenText;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    feedback.textContent = '¡Token copiado!';
                    feedback.className = 'copy-feedback success';
                    
                    setTimeout(() => {
                        feedback.textContent = '';
                        feedback.className = 'copy-feedback';
                    }, 2000);
                    
                } catch (fallbackErr) {
                    feedback.textContent = 'Error al copiar';
                    feedback.className = 'copy-feedback error';
                    
                    setTimeout(() => {
                        feedback.textContent = '';
                        feedback.className = 'copy-feedback';
                    }, 2000);
                }
            }
        });
    }

    // permitir copiar haciendo clic en el token
    if (tokenDisplay) {
        tokenDisplay.addEventListener('click', () => {
            copyBtn.click();
        });
    }

    // Función para mostrar el lanzador del juego con el token
    function showGameLauncher(token) {
        // Generar token más corto
        const shortToken = generateShortToken(document.getElementById('login-email').value);
        currentToken = shortToken;
        
        //pantalla de éxito
        document.getElementById('token-display').textContent = shortToken;
        showForm(document.getElementById('success-screen'));
        
        // Manejar el botón "descargar Juego"
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', function() {
                // Lógica para iniciar el juego?
                window.location.href = `game://launch?token=${shortToken}`;
            });
        }
    }
    
    // Funciones auxiliares
    function showForm(form) {
        // Ocultar todos los formularios
        const allForms = [loginForm, registerForm, forgotForm, recovery_passwordForm, com_passwordForm];
        allForms.forEach(f => f.classList.add('hidden'));
        
        
        const successScreen = document.getElementById('success-screen');
        if (successScreen) {
            successScreen.classList.add('hidden');
        }

        // Mostrar el formulario solicitado
        if (typeof form === 'string') {
            // Si se pasa un string
            document.getElementById(form).classList.remove('hidden');
        } else {
            // Si se pasa un elemento DOM
            form.classList.remove('hidden');
        }
        
        // Limpiar mensajes de error
        clearMessages();
    }
    
    function showError(formElement, message) {
        clearMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        formElement.querySelector('form').appendChild(errorDiv);
    }
    
    function showSuccess(formElement, message) {
        clearMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        formElement.querySelector('form').appendChild(successDiv);
    }
    
    function clearMessages() {
        document.querySelectorAll('.error-message, .success-message').forEach(el => el.remove());
    }
    
    // Verificar si hay un token almacenado
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
        // Verificar validez del token con el backend
        fetch('http://127.0.0.1:5000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${storedToken}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                showGameLauncher(storedToken);
            } else {
                // Token inválido, eliminarlo
                localStorage.removeItem('authToken');
                showForm(loginForm);
            }
        })
        .catch(error => {
            console.error('Token verification error:', error);
            showForm(loginForm);
        });
    }
});