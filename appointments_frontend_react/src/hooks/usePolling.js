import { useEffect, useRef } from 'react';

export const usePolling = (callback, interval = 30000, enabled = true) => {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      savedCallback.current?.();
    };

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval, enabled]);
};

// ============================================
// src/hooks/useAppointments.js
// Hook especializado para citas
// ============================================

import { useState, useEffect, useCallback } from 'react';
import appointmentService from '../api/appointmentService';

export const useAppointments = (autoLoad = true) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAppointments = useCallback(async (includeDeleted = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await appointmentService.getAll(includeDeleted);
      setAppointments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadAppointments();
    }
  }, [autoLoad, loadAppointments]);

  const createAppointment = async (appointmentData) => {
    try {
      const newAppointment = await appointmentService.create(appointmentData);
      setAppointments((prev) => [...prev, newAppointment.data]);
      return { success: true, data: newAppointment };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const updateAppointment = async (id, appointmentData) => {
    try {
      const updated = await appointmentService.update(id, appointmentData);
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? updated.data : apt))
      );
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const deleteAppointment = async (id) => {
    try {
      await appointmentService.delete(id);
      setAppointments((prev) => prev.filter((apt) => apt.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  return {
    appointments,
    loading,
    error,
    loadAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
};