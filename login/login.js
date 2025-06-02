/**
 * Utilidad para mostrar mensajes de error en formularios
 */
function showError(form, message) {
    const errorDiv = form.querySelector('.error-message') || document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    if (!form.querySelector('.error-message')) {
        form.appendChild(errorDiv);
    }
}

/**
 * Utilidad para mostrar mensajes de éxito en formularios
 */
function showSuccess(form, message) {
    const successDiv = form.querySelector('.success-message') || document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    if (!form.querySelector('.success-message')) {
        form.appendChild(successDiv);
    }
    // Oculta errores previos
    const errorDiv = form.querySelector('.error-message');
    if (errorDiv) errorDiv.remove();
}

/**
 * Cambia el formulario visible
 */
function showForm(formToShow) {
    document.querySelectorAll('.form-container').forEach(form => {
        form.classList.add('hidden');
    });
    formToShow.classList.remove('hidden');
    // Limpia mensajes
    const error = formToShow.querySelector('.error-message');
    if (error) error.remove();
    const success = formToShow.querySelector('.success-message');
    if (success) success.remove();
}

/**
 * Valida formato de email
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Maneja el submit de formularios con fetch y feedback visual
 */
function handleFormSubmit(e, form, loadingText, url, body, onSuccess, extraHeaders = {}) {
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = loadingText;
    submitButton.disabled = true;

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...extraHeaders
        },
        body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(data => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        if (data.success) {
            onSuccess(data);
        } else {
            showError(form, '❌ ' + (data.message || 'Error'));
        }
    })
    .catch(error => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        showError(form, '❌ Error en la conexión');
        console.error('Form error:', error);
    });
}

/**
 * Muestra la pantalla de éxito con el token
 */
function showGameLauncher(token) {
    showForm(document.getElementById('success-screen'));
    const tokenDisplay = document.getElementById('token-display');
    if (tokenDisplay) tokenDisplay.textContent = token;
}

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos DOM
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm = document.getElementById('forgot-form');
    const recovery_passwordForm = document.getElementById('recovery_password-form');
    const com_passwordForm = document.getElementById('com_password-form');

    // Enlaces para cambiar entre formularios
    document.getElementById('register-link').addEventListener('click', function(e) {
        e.preventDefault();
        showForm(registerForm);
    });

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

        const email = document.getElementById('forgot-email').value.trim();
        if (!validateEmail(email)) {
            showError(forgotForm, '❌ Ingrese un correo electrónico válido');
            return;
        }

        handleFormSubmit(
            e,
            forgotForm,
            'Procesando...',
            'http://127.0.0.1:5000/recovery_password-rp',
            { email },
            (data) => {
                sessionStorage.setItem('recoveryEmail', email);
                showSuccess(forgotForm, '✅ Correo verificado');
                setTimeout(() => {
                    document.getElementById('recovery-email').value = email;
                    showForm(recovery_passwordForm);
                }, 1500);
            }
        );
    });

    // Login
    document.getElementById('form-login').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!validateEmail(email)) {
            showError(loginForm, '❌ Ingrese un correo electrónico válido');
            return;
        }
        if (!password) {
            showError(loginForm, '❌ Ingrese su contraseña');
            return;
        }

        handleFormSubmit(
            e,
            loginForm,
            'Entrando...',
            'http://127.0.0.1:5000/login',
            { email, password },
            (data) => {
                localStorage.setItem('authToken', data.token);
                showGameLauncher(data.token);
            }
        );
    });
    
    // Registro
    document.getElementById('form-register').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        const securityQuestion = document.getElementById("register-securityQuestion").value;
        const securityAnswer = document.getElementById("register-securityAnswer").value.trim();

        if (!username) {
            showError(registerForm, '❌ Ingrese un nombre de usuario');
            return;
        }
        if (!validateEmail(email)) {
            showError(registerForm, '❌ Ingrese un correo electrónico válido');
            return;
        }
        if (password.length < 6) {
            showError(registerForm, '❌ La contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (password !== passwordConfirm) {
            showError(registerForm, '❌ Las contraseñas no coinciden');
            return;
        }
        if (!securityQuestion || !securityAnswer) {
            showError(registerForm, '❌ Debes seleccionar una pregunta de seguridad y responderla.');
            return;
        }

        handleFormSubmit(
            e,
            registerForm,
            'Registrando...',
            'http://127.0.0.1:5000/register',
            { username, email, password, securityQuestion, securityAnswer },
            (data) => {
                showSuccess(registerForm, 'Registro exitoso. Ahora puedes iniciar sesión.');
                setTimeout(() => {
                    showForm(loginForm);
                }, 2000);
            }
        );
    });
    
    // Recuperación: comprobar identidad
    document.getElementById('form-recovery_password').addEventListener('submit', function(e) {
        e.preventDefault();

        const username = document.getElementById('recovery-username').value.trim();
        const email = document.getElementById('recovery-email').value.trim();
        const securityQuestion = document.getElementById('recovery-securityQuestion').value;
        const securityAnswer = document.getElementById('recovery-securityAnswer').value.trim();

        if (!username) {
            showError(recovery_passwordForm, '❌ Ingrese un nombre de usuario');
            return;
        }
        if (!validateEmail(email)) {
            showError(recovery_passwordForm, '❌ Ingrese un correo electrónico válido');
            return;
        }
        if (!securityQuestion) {
            showError(recovery_passwordForm, '❌ Seleccione una pregunta de seguridad');
            return;
        }
        if (!securityAnswer) {
            showError(recovery_passwordForm, '❌ Ingrese la respuesta de seguridad');
            return;
        }
        const recoveryEmail = sessionStorage.getItem('recoveryEmail');
        if (recoveryEmail && email !== recoveryEmail) {
            showError(recovery_passwordForm, '❌ El correo no coincide con el ingresado anteriormente');
            return;
        }

        handleFormSubmit(
            e,
            recovery_passwordForm,
            'Verificando...',
            'http://127.0.0.1:5000/com_password-cp',
            { username, email, securityQuestion, securityAnswer },
            (data) => {
                if (data.resetToken) {
                    sessionStorage.setItem('resetToken', data.resetToken);
                }
                sessionStorage.setItem('recoveryEmail', email);
                showSuccess(recovery_passwordForm, '✅ Identidad verificada correctamente');
                setTimeout(() => {
                    showForm(com_passwordForm);
                }, 1500);
            }
        );
    });

    // Manejo del cambio de contraseña
    // Cambio de contraseña final
    document.getElementById('form-change-password').addEventListener('submit', function(e) {
        e.preventDefault();

        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const resetToken = sessionStorage.getItem('resetToken');

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

        handleFormSubmit(
            e,
            com_passwordForm,
            'Actualizando...',
            'http://127.0.0.1:5000/change-password-final',
            { newPassword, confirmPassword },
            (data) => {
                sessionStorage.removeItem('resetToken');
                sessionStorage.removeItem('recoveryEmail');
                showSuccess(com_passwordForm, '✅ Contraseña actualizada correctamente');
                document.getElementById('form-change-password').reset();
                document.getElementById('form-recovery_password').reset();
                setTimeout(() => {
                    showForm(loginForm);
                }, 2000);
            },
            {
                'Authorization': `Bearer ${resetToken}`
            }
        );
    });

    // Funcionalidad de copiado del token
    const copyBtn = document.getElementById('copy-btn');
    const tokenDisplay = document.getElementById('token-display');
    if (copyBtn && tokenDisplay) {
        copyBtn.addEventListener('click', async () => {
            const tokenText = tokenDisplay.textContent;
            const feedback = document.getElementById('copy-feedback');
            try {
                await navigator.clipboard.writeText(tokenText);
                copyBtn.textContent = '✓';
                copyBtn.style.backgroundColor = '#28a745';
                feedback.textContent = '¡Token copiado!';
                feedback.className = 'copy-feedback success';
                setTimeout(() => {
                    copyBtn.textContent = 'Copiar';
                    copyBtn.style.backgroundColor = '#6c757d';
                    feedback.textContent = '';
                    feedback.className = 'copy-feedback';
                }, 2000);
            } catch (err) {
                // Fallback para navegadores antiguos
                console.error('Error al copiar usando Clipboard API:', err);
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
                }
            }
        });
    }
                } catch (fallbackErr) {
                    console.error('Error al copiar usando fallback:', fallbackErr);
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