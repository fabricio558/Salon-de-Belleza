import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView, Image, ActivityIndicator } from "react-native";
import axios from 'axios';
import BASE_URL from '../direcIP/ip';

export default function BienvenidaCliente({ navigation }) {
  const [servicios, setServicios] = useState([]);
  const [estilistas, setEstilistas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatosPublicos = async () => {
    try {
      setCargando(true);
      const responseServicios = await axios.get(`${BASE_URL}/router.php?action=get_servicios`);
      if (responseServicios.data && responseServicios.data.success) {
        setServicios(responseServicios.data.data);
      }

      const responseEstilistas = await axios.get(`${BASE_URL}/router.php?action=get_estilistas`);
      if (responseEstilistas.data && responseEstilistas.data.success) {
        setEstilistas(responseEstilistas.data.data);
      }
    } catch (error) {
      console.log("Error cargando datos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosPublicos();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <Text style={styles.logoTexto}>MANDALA</Text>
        <View style={styles.navBotones}>
          <Pressable onPress={() => navigation.navigate('Login')} style={styles.navBtnLogin}>
            <Text style={styles.navBtnLoginText}>Ingresar</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Registro')} style={styles.navBtnRegistro}>
            <Text style={styles.navBtnRegistroText}>Registrarse</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBanner}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1000' }} 
            style={styles.heroImagenFondo} 
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroCajaTexto}>
              <Text style={styles.heroTag}>SALÓN DE BELLEZA</Text>
              <Text style={styles.heroTitulo}>RENOVÁ TU ESTILO</Text>
              <Text style={styles.heroSubtitulo}>Descubre nuestras tendencias en cortes, color y tratamientos exclusivos.</Text>
              <Pressable style={styles.heroBoton} onPress={() => navigation.navigate('Registro')}>
                <Text style={styles.heroBotonTexto}>REGÍSTRATE AHORA →</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.seccionHeader}>
          <Text style={styles.tituloSeccion}>INSPIRACIÓN & TENDENCIAS</Text>
          <Text style={styles.subtituloSeccion}>Explora nuestros trabajos recientes</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galeriaHorizontal}>
          <View style={styles.tarjetaGaleria}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600' }} 
              style={styles.imagenGaleria} 
            />
            <Text style={styles.tituloGaleria}>Cortes & Styling</Text>
          </View>
          <View style={styles.tarjetaGaleria}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=600' }} 
              style={styles.imagenGaleria} 
            />
            <Text style={styles.tituloGaleria}>Coloración Avanzada</Text>
          </View>
          <View style={styles.tarjetaGaleria}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=600' }} 
              style={styles.imagenGaleria} 
            />
            <Text style={styles.tituloGaleria}>Tratamientos Spa</Text>
          </View>
        </ScrollView>

        <View style={styles.seccionCatalogo}>
          <Text style={styles.tituloSeccion}>SERVICIOS DISPONIBLES</Text>
          {cargando ? (
            <ActivityIndicator size="small" color="#000000" style={{ marginVertical: 20 }} />
          ) : servicios.length > 0 ? (
            servicios.map((serv) => (
              <View key={serv.idServicios} style={styles.filaServicio}>
                <Text style={styles.nombreServicio}>{serv.servicio}</Text>
                <Text style={styles.precioServicio}>${serv.precio}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.textoVacio}>No hay servicios registrados.</Text>
          )}
        </View>

        <View style={styles.seccionCatalogo}>
          <Text style={styles.tituloSeccion}>NUESTROS ESTILISTAS</Text>
          {estilistas.length > 0 ? (
            estilistas.map((est) => (
              <View key={est.idEstilistas || est.idUsuarios || est.id} style={styles.filaEstilista}>
                <Image 
                  source={{ uri: est.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300' }} 
                  style={styles.avatarEstilista} 
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.nombreEstilista}>{est.nombres} {est.apellido}</Text>
                  <Text style={styles.rolEstilista}>Especialista Profesional</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.textoVacio}>Profesionales listos para atenderte.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  navBar: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 2,
  },
  logoTexto: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 2,
  },
  navBotones: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  navBtnLogin: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navBtnLoginText: {
    fontWeight: 'bold',
    color: '#000000',
    fontSize: 14,
  },
  navBtnRegistro: {
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  navBtnRegistroText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroBanner: {
    width: '100%',
    height: 380,
    backgroundColor: '#000000',
    position: 'relative',
  },
  heroImagenFondo: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.75,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: 25,
  },
  heroCajaTexto: {
    maxWidth: '90%',
  },
  heroTag: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  heroTitulo: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitulo: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 15,
  },
  heroBoton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  heroBotonTexto: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  seccionHeader: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
  },
  tituloSeccion: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  subtituloSeccion: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  galeriaHorizontal: {
    paddingLeft: 20,
    marginBottom: 30,
  },
  tarjetaGaleria: {
    width: 240,
    marginRight: 15,
  },
  imagenGaleria: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  tituloGaleria: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 8,
  },
  seccionCatalogo: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  filaServicio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  nombreServicio: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '600',
  },
  precioServicio: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000000',
  },
  filaEstilista: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  avatarEstilista: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#E0E0E0',
    marginRight: 15,
  },
  nombreEstilista: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  rolEstilista: {
    fontSize: 13,
    color: '#777777',
  },
  textoVacio: {
    color: '#888888',
    fontStyle: 'italic',
    marginTop: 10,
  },
});