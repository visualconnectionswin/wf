from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os

# --- Configuration ---
NUEVO_SEGUIMIENTO = 'https://appwinforce.win.pe/nuevoSeguimiento'
LOGIN_PATH = '/login'
DOCUMENTO = '47695489'  # número de documento a consultar
# Cookie exportado en JSON (dominio appwinforce.win.pe)
COOKIE = {
    'name': 'PHPSESSID',
    'value': 'a2fcc254d8bd7be90d68312f6eb24bdf',
    'domain': 'appwinforce.win.pe',
    'path': '/',
    'secure': False,
    'httpOnly': False
}

# --- Setup Chrome options ---
chrome_options = Options()
chrome_options.add_argument('--headless')  # Ejecutar en modo no visible

driver = webdriver.Chrome(options=chrome_options)
wait = WebDriverWait(driver, 15)

# --- JavaScript to inject (ahora en archivo externo) ---
script_dir = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(script_dir, 'inject.js'), 'r', encoding='utf-8') as f:
    JS_SCRIPT = f.read()

try:
    driver.get(NUEVO_SEGUIMIENTO)
    time.sleep(1)
    if LOGIN_PATH in driver.current_url:
        driver.delete_all_cookies()
        driver.add_cookie(COOKIE)
        driver.get(NUEVO_SEGUIMIENTO)
        time.sleep(1)

    driver.execute_script(JS_SCRIPT)

    # Ingresar documento y presionar Enter para disparar JS listener
    input_el = wait.until(EC.element_to_be_clickable((By.ID, 'documento_identidad')))
    input_el.clear()
    input_el.send_keys(DOCUMENTO + Keys.ENTER)

    # --- Captura de popups y mensajes de error ---
    popup_message = None
    try:
        # Espera breve para posibles popups JS
        time.sleep(1)
        alert = driver.switch_to.alert
        popup_message = alert.text
        print(f"Popup JS detectado: {popup_message}")
        alert.accept()
    except Exception:
        pass  # No hay alert JS

    # Buscar mensajes de error en la página (modales, banners, etc.)
    error_selectors = [
        '.swal2-popup .swal2-html-container',  # SweetAlert2
        '.modal-content .modal-body',          # Bootstrap modal
        '.alert-danger',                      # Bootstrap alert
        '.toast-message',                     # Toastr
        '#mensaje_error',                     # ID común
        '.error-message',                     # Clase común
    ]
    for selector in error_selectors:
        try:
            elems = driver.find_elements(By.CSS_SELECTOR, selector)
            for elem in elems:
                if elem.is_displayed() and elem.text.strip():
                    popup_message = elem.text.strip()
                    print(f"Mensaje de error detectado: {popup_message}")
        except Exception:
            continue

    if popup_message:
        print(f"Proceso detenido por popup/mensaje: {popup_message}")
    else:
        # Esperar que aparezca el score en la página
        score_el = WebDriverWait(driver, 15).until(
            EC.text_to_be_present_in_element((By.ID, 'estamos_verificando'), 'Score:')
        )
        print(f"Score obtenido: {driver.find_element(By.ID, 'estamos_verificando').text}")

except Exception as e:
    print(f"Error en el proceso: {e}")

finally:
    driver.quit()