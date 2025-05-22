(function() {
    // Listener para auto-selección de tipo de documento
    const input = document.querySelector('#documento_identidad');
    const select = document.querySelector('#tipo_doc');
    if (input && select) {
        input.addEventListener('input', () => {
            input.value = input.value.replace(/\s+/g, '');
            input.value = input.value.replace(/[^0-9]/g, '');
            const length = input.value.length;
            if (length === 8) {
                select.value = '1';
                select.dispatchEvent(new Event('change'));
            } else if (length === 9) {
                select.value = '3';
                select.dispatchEvent(new Event('change'));
            } else if (length === 11) {
                select.value = '6';
                select.dispatchEvent(new Event('change'));
            }
            if (length > 11) {
                input.value = input.value.slice(0, 11);
            }
        });
        // NUEVO: disparar búsqueda al presionar Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const searchBtn = document.querySelector('#search_score_cliente');
                if (searchBtn) {
                    searchBtn.click();
                }
            }
        });
    }

    return new Promise((resolve, reject) => {
        function waitForElement(selector) {
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    const element = document.querySelector(selector);
                    if (element) {
                        clearInterval(interval);
                        resolve(element);
                    }
                }, 100);
            });
        }

        async function performActions() {
            try {
                // Espera por el botón de "Nuevo Lead" y hace clic
                const nuevoLeadButton = await waitForElement('#btnNuevoLead');
                nuevoLeadButton.click();

                // Espera 100ms antes de proceder con el flujo siguiente
                await new Promise(resolve => setTimeout(resolve, 100));

                // Ejecuta la lógica de flujo de Score
                await ejecutarFlujoScore();

                // Elimina los elementos innecesarios después de que se haya mostrado la segunda página
                eliminarElementos();

                resolve("Flujo de Score ejecutado correctamente.");
            } catch (error) {
                console.error("Error: ", error);
                if (typeof AndroidInterface !== 'undefined' && AndroidInterface.logError) {
                    AndroidInterface.logError("Error en performActions: " + error.message + (error.stack ? " Stack: " + error.stack : ""));
                }
                reject("Error: " + error.message);
            }
        }

        async function ejecutarFlujoScore() {
            try {
                // Inicializa el contador en 1 para que empiece en la segunda página
                let countador_ = 1;

                // Oculta la primera página y muestra la segunda directamente
                const page0 = await waitForElement('.page_0');
                const page1 = await waitForElement('.page_1');
                const pageContent0 = await waitForElement('#page_content_0');
                const pageContent1 = await waitForElement('#page_content_1');

                page0.classList.remove('current');
                page1.classList.add('current');
                pageContent0.classList.remove('current');
                pageContent1.classList.add('current');
                
                // Muestra el botón "anterior" y habilita el botón "continuar"
                const anteriorBtn = await waitForElement("#anterior");
                anteriorBtn.style.display = 'block';
                
                const continuarBtn = document.querySelector("#continuar"); // Puede no existir siempre
                if (continuarBtn) {
                    continuarBtn.disabled = false;
                }

            } catch (error) {
                console.error('Error al ejecutar el flujo de Score:', error);
                 if (typeof AndroidInterface !== 'undefined' && AndroidInterface.logError) {
                    AndroidInterface.logError("Error en ejecutarFlujoScore: " + error.message + (error.stack ? " Stack: " + error.stack : ""));
                }
            }
        }

        function eliminarElementos() {
            // Mejora: eliminar los nuevos bloques de checkboxes
            const tratamientoDiv = document.querySelector('input#checkTratamientoDatos')?.closest('div.col-md-12');
            if (tratamientoDiv) {
                tratamientoDiv.remove();
            }
            // Mejora: eliminar el bloque de "Vendedor"
            const vendedorDiv = document.querySelector('select[name="agencia"]')?.closest('div.row.g-9.mb-8');
            if (vendedorDiv) {
                vendedorDiv.remove();
            }

            const selectores = [
                '#kt_modal_create_account > div > div > div.modal-header',
                '#kt_create_account_stepper > div.stepper-nav.py-5',
                '#nuevo_seguimiento > div.page_1.current > div > div > div > div.col-lg-5',
                '#nuevo_seguimiento > div.page_1.current > div > div > div > div > div:nth-child(6)',
                '#nuevo_seguimiento > div.page_1.current > div > div > div > div > div:nth-child(8)',
                '#nuevo_seguimiento > div.page_1.current > div > div > div > div > div:nth-child(10) > div > label',
                'textarea[name="bus_obs"]#observaciones',
                '#nuevo_seguimiento > div.page_1.current > div > div > div > div > div:nth-child(11)',
                '#register_search',
                '#kt_create_account_stepper > div.d-flex.flex-stack.pt-15',
                '#nuevoCliente',
                '#nuevo_seguimiento > div.page_1.current > div > div > div > div.col-lg-7 > div:nth-child(12) > div > span.fw-bolder'
            ];

            selectores.forEach(selector => {
                try {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.remove();
                    }
                } catch(e) {
                    if (typeof AndroidInterface !== 'undefined' && AndroidInterface.logError) {
                        AndroidInterface.logError("Error eliminando selector: " + selector + " - " + e.message);
                    }
                }
            });

            function ocultarContador() {
                try {
                    const xpath = '/html/body/div[1]/div[1]/div[1]/div[4]/div/div/div[2]/div/div[2]/div[2]/div/div/div/div[2]/div[10]';
                    const xpathResult = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    const elementByXPath = xpathResult.singleNodeValue;
                    
                    if (elementByXPath) {
                        const spanContador = elementByXPath.querySelector('span.fw-bolder');
                        if (spanContador && spanContador.textContent.includes('Quedan')) {
                            spanContador.remove();
                            return;
                        }
                    }

                    const divsRow = document.querySelectorAll('.row.mb-8');
                    divsRow.forEach(divRow => {
                        const spans = divRow.querySelectorAll('span.fw-bolder');
                        spans.forEach(span => {
                            if (span.textContent.includes('Quedan')) {
                                span.remove();
                            }
                        });
                    });

                    const styleId = 'dynamic-hide-style';
                    if (!document.getElementById(styleId)) {
                        const style = document.createElement('style');
                        style.id = styleId;
                        style.textContent = `
                            div.row.mb-8 > div.col-md-6 > span.fw-bolder,
                            #contadorCaracteres,
                            #kt_body > div.page_1.current > div > div > div > div.col-lg-7 > div:nth-child(12) > div > span.fw-bolder
                            { display: none !important; }
                        `;
                        document.head.appendChild(style);
                    }
                } catch(e) {
                    if (typeof AndroidInterface !== 'undefined' && AndroidInterface.logError) {
                        AndroidInterface.logError("Error en ocultarContador: " + e.message);
                    }
                }
            }

            ocultarContador();

            if (typeof AndroidInterface !== 'undefined' && AndroidInterface.onActionsCompleted) {
                AndroidInterface.onActionsCompleted();
            }
            if (typeof AndroidInterface !== 'undefined' && AndroidInterface.setElementosEliminados) {
                AndroidInterface.setElementosEliminados(true);
            }
        }

        performActions();
    });
})();
