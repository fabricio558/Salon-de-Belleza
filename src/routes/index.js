import { Router } from 'express'
import { title } from 'process'
const router = Router()

router.get('/index', (req, res) => res.render('index', {Titulo: 'Index'}))

router.get('/about', (req, res) => res.render('about', {Titulo: 'About'}))

router.get('/contact', (req, res) => res.render('contact', {Titulo: 'Contact'}))

export default router