import request from 'supertest';
import express from 'express';
import { localeMiddleware } from '../../src/middleware/locale.middleware';
import { resolvePolyglotPayload } from '../../src/utils/polyglot-resolver';
import createApp from '../../src/app';
import { authService } from '../../src/services/auth.service';
import { institutionService } from '../../src/services/institution.service';

// Mock Services
jest.mock('../../src/services/auth.service', () => ({
  authService: {
    login: jest.fn(),
  },
}));

jest.mock('../../src/services/institution.service', () => ({
  institutionService: {
    getHierarchyTree: jest.fn(),
  },
}));

const mockLogin = authService.login as jest.Mock;
const mockGetHierarchyTree = institutionService.getHierarchyTree as jest.Mock;

describe('Polyglot Data Engine & Localization Synchronization', () => {
  describe('Unit: resolvePolyglotPayload', () => {
    const testData = {
      name_en: 'Holy Trinity Cathedral',
      name_am: 'ቅድስት ሥላሴ ካቴድራል',
      name_gez: 'ቅድስት ሥላሴ ካቴድራል (Ge\'ez)',
      type: 'PARISH',
      user: {
        title_en: 'Priest',
        title_am: 'ቀሲስ',
        title_gez: null, // should fall back to 'am'
        name_en: 'Yonas',
        name_am: null, // should fall back to 'en'
        name_gez: null, // should fall back to 'en'
      },
    };

    it('resolves Amharic locale correctly', () => {
      const resolved = resolvePolyglotPayload(testData, 'am');
      expect(resolved.name).toBe('ቅድስት ሥላሴ ካቴድራል');
      expect(resolved.type).toBe('ደብር'); // maps PARISH to Ethiopic
      expect(resolved.user.title).toBe('ቀሲስ');
      expect(resolved.user.name).toBe('Yonas'); // falls back to 'en'
    });

    it('resolves Ge\'ez locale with fallback chains (gez -> am -> en)', () => {
      const resolved = resolvePolyglotPayload(testData, 'gez');
      expect(resolved.name).toBe('ቅድስት ሥላሴ ካቴድራል (Ge\'ez)');
      expect(resolved.type).toBe('ደብር');
      expect(resolved.user.title).toBe('ቀሲስ'); // falls back to 'am'
      expect(resolved.user.name).toBe('Yonas'); // falls back to 'en'
    });

    it('resolves English locale correctly without converting enums', () => {
      const resolved = resolvePolyglotPayload(testData, 'en');
      expect(resolved.name).toBe('Holy Trinity Cathedral');
      expect(resolved.type).toBe('PARISH');
      expect(resolved.user.title).toBe('Priest');
      expect(resolved.user.name).toBe('Yonas');
    });

    it('handles arrays of entities recursively', () => {
      const resolved = resolvePolyglotPayload([testData, testData], 'am');
      expect(resolved).toHaveLength(2);
      expect(resolved[0].name).toBe('ቅድስት ሥላሴ ካቴድራል');
      expect(resolved[0].type).toBe('ደብር');
      expect(resolved[1].name).toBe('ቅድስት ሥላሴ ካቴድራል');
    });

    it('maps all systemic structural enums to Ethiopic', () => {
      const scopes = ['PATRIARCHATE', 'ARCHDIOCESE', 'DIOCESE', 'PARISH'];
      const data = scopes.map((s) => ({ type: s }));
      const resolved = resolvePolyglotPayload(data, 'am');
      expect(resolved[0].type).toBe('መንበረ ፓትርያርክ');
      expect(resolved[1].type).toBe('ሊቀ ጳጳሳት');
      expect(resolved[2].type).toBe('ሀገረ ስብከት');
      expect(resolved[3].type).toBe('ደብር');
    });
  });

  describe('Middleware: localeMiddleware', () => {
    let testApp: express.Application;

    beforeAll(() => {
      testApp = express();
      testApp.use(localeMiddleware);
      testApp.get('/test-locale', (req, res) => {
        res.json({ locale: req.locale });
      });
    });

    it('extracts locale from query string ?lang=', async () => {
      const res = await request(testApp).get('/test-locale?lang=am');
      expect(res.body.locale).toBe('am');
    });

    it('extracts locale from Accept-Language header', async () => {
      const res = await request(testApp)
        .get('/test-locale')
        .set('Accept-Language', 'gez,en-US;q=0.9');
      expect(res.body.locale).toBe('gez');
    });

    it('defaults to en on invalid language codes', async () => {
      const res = await request(testApp).get('/test-locale?lang=fr');
      expect(res.body.locale).toBe('en');
    });

    it('defaults to en if no headers or query parameters provided', async () => {
      const res = await request(testApp).get('/test-locale');
      expect(res.body.locale).toBe('en');
    });
  });

  describe('Integration: Controller Polyglot Synchronization', () => {
    const app = createApp();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('resolves auth login details through the polyglot engine (Amharic translation)', async () => {
      mockLogin.mockResolvedValue({
        token: 'mock-jwt-token',
        user: {
          id: 'user-id-1',
          email: 'priest@orthodoxconnect.org',
          ecclesiastical_role: 'PRIEST',
          institution_id: 'inst-1',
          fullName: 'Aba Tekle',
          nameEn: 'Tekle',
          nameAm: 'ተክሌ',
          nameGez: 'ተክሌ (ግዕዝ)',
          institution: {
            id: 'inst-1',
            hierarchyPath: '/inst-1/',
            type: 'PARISH',
            nameEn: 'Selassie Church',
            nameAm: 'ሥላሴ ቤተክርስቲያን',
          },
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Accept-Language', 'am')
        .send({ email: 'priest@orthodoxconnect.org', password: 'orthodox123' })
        .expect(200);

      // Enums mapped and properties flattened
      expect(res.body.data.user.name).toBe('ተክሌ');
      expect(res.body.data.user.institution.name).toBe('ሥላሴ ቤተክርስቲያን');
      expect(res.body.data.user.institution.type).toBe('ደብር'); // PARISH -> ደብር

      // Ensure raw translation fields are stripped from the response
      expect(res.body.data.user.nameAm).toBeUndefined();
      expect(res.body.data.user.institution.nameAm).toBeUndefined();
    });

    it('resolves hierarchy tree correctly using the polyglot engine (Ge\'ez translation)', async () => {
      // Mock hierarchy tree
      mockGetHierarchyTree.mockResolvedValue({
        id: 'inst-1',
        nameEn: 'Synod',
        nameAm: 'ቅዱስ ሲኖዶስ',
        nameGez: 'ቅዱስ ሲኖዶስ (ግዕዝ)',
        type: 'PATRIARCHATE',
        hierarchyPath: '/inst-1/',
        children: [
          {
            id: 'inst-2',
            nameEn: 'Addis Ababa Archdiocese',
            nameAm: 'የአዲስ አበባ ሊቀ ጳጳሳት',
            type: 'ARCHDIOCESE',
            hierarchyPath: '/inst-1/inst-2/',
            children: [],
          },
        ],
      });

      const mockJwt = 'mock-jwt-token';
      // In this test, we can use a dummy jwt token since authenticateJwt is mocked
      // Or we can mock the authenticateJwt middleware or sign a valid JWT
      // Let's sign a valid JWT to make the request pass through authenticateJwt
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../../src/middleware/auth.middleware');
      const token = jwt.sign(
        {
          sub: 'user-id-1',
          institution_id: 'inst-1',
          hierarchy_path: '/inst-1/',
          ecclesiastical_role: 'BISHOP',
        },
        JWT_SECRET,
      );

      const res = await request(app)
        .get('/api/v1/institutions/hierarchy')
        .set('Authorization', `Bearer ${token}`)
        .set('Accept-Language', 'gez')
        .expect(200);

      // Root resolved
      expect(res.body.data.name).toBe('ቅዱስ ሲኖዶስ (ግዕዝ)');
      expect(res.body.data.type).toBe('መንበረ ፓትርያርክ'); // PATRIARCHATE -> መንበረ ፓትርያርክ

      // Children resolved recursively
      expect(res.body.data.children[0].name).toBe('የአዲስ አበባ ሊቀ ጳጳሳት'); // falls back to 'am' because 'gez' is missing
      expect(res.body.data.children[0].type).toBe('ሊቀ ጳጳሳት'); // ARCHDIOCESE -> ሊቀ ጳጳሳት
    });
  });
});
