import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView, Image, ActivityIndicator } from "react-native";
import axios from 'axios';
import BASE_URL from '../direcIP/ip';
import Header from "../components/header";
import ServicioItem from "../components/ServicioItem";
import EstilistaItem from "../components/EstilistaItem";
import TarjetaGaleria from "../components/TarjetaGaleria"; 

export default function HomeCliente({ navigation }) {
  const [servicios, setServicios] = useState([]);
  const [estilistas, setEstilistas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const itemsGaleria = [
    {
      id: '1',
      titulo: 'Alisado Progresivo',
      imagen: require('../img/alisado.png'),
    },
    {
      id: '2',
      titulo: 'Coloración',
      imagen: require('../img/coloracion.png'),
    },
    {
      id: '3',
      titulo: 'Peinado y Modelado',
      imagen: require('../img/peinado.png'),
    },
  ];

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
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBanner}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1000' }} 
            style={styles.heroImagenFondo} 
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroCajaTexto}>
              <Text style={styles.heroTag}>BIENVENIDO</Text>
              <Text style={styles.heroTitulo}>RENOVÁ TU ESTILO</Text>
              <Text style={styles.heroSubtitulo}>Reserva tu turno de manera rápida y disfruta de nuestros servicios exclusivos.</Text>
              <Pressable style={styles.heroBoton} onPress={() => navigation.navigate('Reservar Cita')}>
                <Text style={styles.heroBotonTexto}>RESERVAR UN TURNO →</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.seccionHeader}>
          <Text style={styles.tituloSeccion}>INSPIRACIÓN & TENDENCIAS</Text>
          <Text style={styles.subtituloSeccion}>Explora nuestros trabajos recientes</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galeriaHorizontal}>
          {itemsGaleria.map((item) => (
            <TarjetaGaleria 
              key={item.id}
              imagen={item.imagen}
              titulo={item.titulo}
            />
          ))}
        </ScrollView>

        <View style={styles.seccionCatalogo}>
          <Text style={styles.tituloSeccion}>SERVICIOS DESTACADOS</Text>
          {cargando ? (
            <ActivityIndicator size="small" color="#000000" style={{ marginVertical: 20 }} />
          ) : servicios.length > 0 ? (
            servicios.slice(0, 5).map((serv) => (  
              <ServicioItem 
                key={serv.idServicios}
                servicio={serv.servicio}
                precio={serv.precio}
                imagenUrl={serv.imagenUrl}
              />
            ))
          ) : (
            <Text style={styles.textoVacio}>No hay servicios registrados.</Text>
          )}
        </View>

        <View style={styles.seccionCatalogo}>
          <Text style={styles.tituloSeccion}>NUESTROS ESTILISTAS</Text>
          {estilistas.length > 0 ? (
            estilistas.map((est) => (
              <EstilistaItem 
                key={est.idEstilistas || est.idUsuarios || est.id}
                nombres={est.nombres}
                apellido={est.apellido}
                foto={est.foto}
              />
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
  seccionCatalogo: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  textoVacio: {
    color: '#888888',
    fontStyle: 'italic',
    marginTop: 10,
  },
});