// Espera a que todo el contenido del HTML esté cargado antes de ejecutar el script.
document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DEL DOM ---
    const malla = document.getElementById('malla');
    const todosLosRamos = document.querySelectorAll('.ramo');
    const modal = document.getElementById('modal-requisitos');
    const cerrarModalBtn = document.querySelector('.cerrar-modal');
    const listaRequisitosUl = document.getElementById('lista-requisitos');
    const resetearBtn = document.getElementById('resetearBtn');

    // --- ESTADO DE LA APLICACIÓN ---
    // Carga los ramos aprobados desde localStorage. Si no hay nada, empieza con un Set vacío.
    // Usamos un Set para evitar duplicados y tener búsquedas más eficientes (O(1)).
    let ramosAprobados = new Set(JSON.parse(localStorage.getItem('ramosAprobados')) || []);

    /**
     * Función principal que actualiza el estado visual de TODOS los ramos.
     * Se llama al cargar la página y cada vez que se aprueba o desaprueba un ramo.
     */
    const actualizarMalla = () => {
        todosLosRamos.forEach(ramo => {
            const idRamo = ramo.id;
            const requisitos = (ramo.dataset.requisitos || '').split(',').filter(Boolean); // Convierte string de requisitos en un array

            // Limpia clases de estado previas
            ramo.classList.remove('aprobado', 'bloqueado');

            if (ramosAprobados.has(idRamo)) {
                // 1. Si el ramo está en el set de aprobados, se marca como tal.
                ramo.classList.add('aprobado');
            } else {
                // 2. Si no está aprobado, verificar si sus requisitos se cumplen.
                const requisitosCumplidos = requisitos.every(reqId => ramosAprobados.has(reqId));
                if (!requisitosCumplidos) {
                    // Si falta al menos un requisito, se bloquea.
                    ramo.classList.add('bloqueado');
                }
            }
        });
    };
    
    /**
     * Maneja el evento de clic en cualquier parte de la malla.
     * Usa delegación de eventos para escuchar clics solo en elementos con la clase '.ramo'.
     * @param {Event} e - El objeto del evento de clic.
     */
    const manejarClickEnRamo = (e) => {
        const ramoClickeado = e.target.closest('.ramo');
        if (!ramoClickeado) return; // Si el clic no fue en un ramo, no hacer nada.

        const id = ramoClickeado.id;
        const esAprobado = ramoClickeado.classList.contains('aprobado');
        const esBloqueado = ramoClickeado.classList.contains('bloqueado');

        if (esBloqueado) {
            // Si el ramo está bloqueado, muestra el modal con los requisitos pendientes.
            mostrarModalRequisitos(ramoClickeado);
            return;
        }

        if (esAprobado) {
            // Si ya estaba aprobado, lo des-aprueba.
            ramosAprobados.delete(id);
            // IMPORTANTE: Des-aprobar en cascada. Si quito un ramo, los que dependen de él también se deben desaprobar.
            desaprobarCascada(id);
        } else {
            // Si no estaba aprobado, lo aprueba.
            ramosAprobados.add(id);
        }

        // Guarda el estado actualizado en localStorage.
        guardarProgreso();
        // Vuelve a dibujar toda la malla con los estados actualizados.
        actualizarMalla();
    };

    /**
     * Des-aprueba recursivamente todos los ramos que dependen del ramo que se acaba de quitar.
     * @param {string} idRamoQuitado - El ID del ramo que se des-aprobó.
     */
    const desaprobarCascada = (idRamoQuitado) => {
        todosLosRamos.forEach(ramo => {
            const requisitos = (ramo.dataset.requisitos || '').split(',');
            if (requisitos.includes(idRamoQuitado) && ramosAprobados.has(ramo.id)) {
                ramosAprobados.delete(ramo.id);
                desaprobarCascada(ramo.id); // Llamada recursiva
            }
        });
    }

    /**
     * Muestra una ventana emergente (modal) con la lista de ramos que faltan por aprobar.
     * @param {HTMLElement} ramoBloqueado - El elemento del ramo que está bloqueado.
     */
    const mostrarModalRequisitos = (ramoBloqueado) => {
        const requisitos = (ramoBloqueado.dataset.requisitos || '').split(',').filter(Boolean);
        const requisitosFaltantes = requisitos.filter(reqId => !ramosAprobados.has(reqId));
        
        // Limpia la lista anterior
        listaRequisitosUl.innerHTML = ''; 

        // Rellena la lista con los nombres de los ramos faltantes.
        requisitosFaltantes.forEach(reqId => {
            const ramoRequisito = document.getElementById(reqId);
            const nombreRequisito = ramoRequisito ? ramoRequisito.dataset.nombre : 'Ramo desconocido';
            const li = document.createElement('li');
            li.textContent = nombreRequisito;
            listaRequisitosUl.appendChild(li);
        });
        
        // Muestra el modal
        modal.style.display = 'flex';
    };

    /**
     * Oculta el modal de requisitos.
     */
    const cerrarModal = () => {
        modal.style.display = 'none';
    };

    /**
     * Guarda el set de ramos aprobados en localStorage.
     * Convierte el Set a un Array y luego a una cadena JSON.
     */
    const guardarProgreso = () => {
        localStorage.setItem('ramosAprobados', JSON.stringify(Array.from(ramosAprobados)));
    };
    
    /**
     * Limpia todo el progreso guardado y reinicia la malla.
     */
    const resetearProgreso = () => {
        if (confirm('¿Estás seguro de que quieres borrar todo tu progreso? Esta acción no se puede deshacer.')) {
            ramosAprobados.clear();
            localStorage.removeItem('ramosAprobados');
            actualizarMalla();
        }
    };

    // --- ASIGNACIÓN DE EVENTOS ---
    malla.addEventListener('click', manejarClickEnRamo);
    cerrarModalBtn.addEventListener('click', cerrarModal);
    resetearBtn.addEventListener('click', resetearProgreso);
    
    // Cierra el modal si el usuario hace clic fuera del contenido.
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            cerrarModal();
        }
    });

    // --- INICIALIZACIÓN ---
    // Llama a la función por primera vez para establecer el estado inicial de la malla.
    actualizarMalla();
});
