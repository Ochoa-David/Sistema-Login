from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
import unittest
import secrets

class AuthenticationTests(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Chrome()
        self.driver.get("http://localhost:5000")
        self.driver.maximize_window()
        self.wait = WebDriverWait(self.driver, 10)
    
    def tearDown(self):
        self.driver.quit()
    
    def generate_random_email(self):
        return f"test{secrets.randbelow(9000) + 1000}@example.com"
    
    # ==== INICIO TEST: Inicio de sesión exitoso ====
    def test_login_success(self):
        email = "hola04@gmail.com"
        # Usar variable de entorno o configuración para la contraseña real
        import os
        password = os.environ.get("TEST_USER_PASSWORD", "dummy_password")
        
        email_input = self.driver.find_element(By.ID, "login-email")
        password_input = self.driver.find_element(By.ID, "login-password")
        
        email_input.send_keys(email)
        password_input.send_keys(password)
        
        login_button = self.driver.find_element(By.CSS_SELECTOR, "#form-login button[type='submit']")
        login_button.click()
        
        try:
            launch_button = self.wait.until(
                EC.presence_of_element_located((By.ID, "launch-game"))
            )
            self.assertTrue(launch_button.is_displayed())
            print("✅ Test de inicio de sesión exitoso completado")
        except:
            self.fail("❌ Error: No se pudo iniciar sesión correctamente")
    # ==== FIN TEST: Inicio de sesión exitoso ====

    # ==== INICIO TEST: Inicio de sesión fallido ====
    def test_login_failure(self):
        email = "usuario_no_existe@example.com"
        # Contraseña incorrecta para test, no hardcodear valor sensible
        password = "incorrect_password"
        
        email_input = self.driver.find_element(By.ID, "login-email")
        password_input = self.driver.find_element(By.ID, "login-password")
        
        email_input.send_keys(email)
        password_input.send_keys(password)
        
        login_button = self.driver.find_element(By.CSS_SELECTOR, "#form-login button[type='submit']")
        login_button.click()
        
        try:
            error_message = self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "error-message"))
            )
            self.assertTrue(error_message.is_displayed())
            print("✅ Test de inicio de sesión fallido completado")
        except:
            self.fail("❌ Error: No se mostró mensaje de error para credenciales inválidas")
    # ==== FIN TEST: Inicio de sesión fallido ====

    # ==== INICIO TEST: Registro válido ====
    def test_registration_valid(self):
        register_link = self.driver.find_element(By.ID, "register-link")
        register_link.click()
        
        username = f"user{secrets.randbelow(9000) + 1000}"
        email = self.generate_random_email()
        # Usar variable de entorno o configuración para la contraseña de test
        import os
        password = os.environ.get("TEST_REGISTER_PASSWORD", "dummy_password_123")
        
        self.wait.until(EC.visibility_of_element_located((By.ID, "register-username")))
        
        username_input = self.driver.find_element(By.ID, "register-username")
        email_input = self.driver.find_element(By.ID, "register-email")
        password_input = self.driver.find_element(By.ID, "register-password")
        confirm_input = self.driver.find_element(By.ID, "register-password-confirm")
        
        username_input.send_keys(username)
        email_input.send_keys(email)
        password_input.send_keys(password)
        confirm_input.send_keys(password)
        
        security_question = Select(self.driver.find_element(By.ID, "securityQuestion"))
        security_question.select_by_value("nombre_mascota")
        
        security_answer = self.driver.find_element(By.ID, "securityAnswer")
        security_answer.send_keys("Rex")
        
        register_button = self.driver.find_element(By.CSS_SELECTOR, "#form-register button[type='submit']")
        register_button.click()
        
        try:
            success_message = self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "success-message"))
            )
            self.assertTrue(success_message.is_displayed())
            print("✅ Test de registro válido completado")
        except:
            self.fail("❌ Error: No se mostró mensaje de éxito al registrar")
    # ==== FIN TEST: Registro válido ====

    # ==== INICIO TEST: Registro inválido ====
    def test_registration_invalid(self):
        register_link = self.driver.find_element(By.ID, "register-link")
        register_link.click()
        
        username = f"user{secrets.randbelow(9000) + 1000}"
        email = self.generate_random_email()
        # Contraseñas de prueba no sensibles
        password = "Password1234!"
        confirm_password = "DifferentPassword456!"
        
        self.wait.until(EC.visibility_of_element_located((By.ID, "register-username")))
        
        username_input = self.driver.find_element(By.ID, "register-username")
        email_input = self.driver.find_element(By.ID, "register-email")
        password_input = self.driver.find_element(By.ID, "register-password")
        confirm_input = self.driver.find_element(By.ID, "register-password-confirm")
        
        username_input.send_keys(username)
        email_input.send_keys(email)
        password_input.send_keys(password)
        confirm_input.send_keys(confirm_password)
        
        security_question = Select(self.driver.find_element(By.ID, "securityQuestion"))
        security_question.select_by_value("color_favorito")
        
        security_answer = self.driver.find_element(By.ID, "securityAnswer")
        security_answer.send_keys("Azul")
        
        register_button = self.driver.find_element(By.CSS_SELECTOR, "#form-register button[type='submit']")
        register_button.click()
        
        try:
            error_message = self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "error-message"))
            )
            self.assertTrue(error_message.is_displayed())
            print("✅ Test de registro inválido completado")
        except:
            self.fail("❌ Error: No se mostró mensaje de error para contraseñas diferentes")
    # ==== FIN TEST: Registro inválido ====

    # ==== INICIO TEST: Recuperación de contraseña ====
    def test_recovery_password_flow(self):
        forgot_link = self.driver.find_element(By.ID, "forgot-password-link")
        forgot_link.click()
        
        recovery_email = "hola04@gmail.com"
        
        self.wait.until(EC.visibility_of_element_located((By.ID, "forgot-email")))
        email_input = self.driver.find_element(By.ID, "forgot-email")
        email_input.send_keys(recovery_email)
        
        recovery_button = self.driver.find_element(By.ID, "recovery_password-rp-link")
        recovery_button.click()
        
        try:
            success_message = self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "success-message"))
            )
            self.assertTrue(success_message.is_displayed())
            print("✅ Test de solicitud de recuperación de contraseña completado")
        except:
            self.fail("❌ Error: No se mostró mensaje de éxito en la recuperación de contraseña")
    # ==== FIN TEST: Recuperación de contraseña ====

if __name__ == "__main__":
    unittest.main()
