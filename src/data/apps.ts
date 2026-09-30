import gohobiIcon from '../assets/icons/gohobi.png'
import kinenbiIcon from '../assets/icons/kinenbi.png'
import madaaruIcon from '../assets/icons/madaaru.png'
import nanikiruIcon from '../assets/icons/nanikiru.png'
import nomanIcon from '../assets/icons/noman.png'

export type Platform = 'ios' | 'android'

/** published: 公開中 / review: 審査中 / development: 開発中 */
export type AppStatus = 'published' | 'review' | 'development'

export type AppInfo = {
  /** URLやキーに使う英字識別子 */
  id: string
  /** 表示名 */
  name: string
  /** 短いキャッチコピー（任意） */
  tagline?: string
  description: string
  /** src/assets/icons/ に置いた画像をimportして指定する */
  icon: string
  platforms: Platform[]
  status: AppStatus
  /** ストアで公開（または提出）しているバージョン。手動管理 */
  version?: string
  appStoreUrl?: string
  googlePlayUrl?: string
  privacyPolicyUrl?: string
  supportUrl?: string
}

/**
 * 掲載アプリ一覧。配列の順番がそのまま表示順になる。
 * 新しいアプリはアイコンを src/assets/icons/ に置き、ここへ1件追加する。
 */
export const apps: AppInfo[] = [
  {
    id: 'kinenbi',
    name: 'Kinenbi',
    tagline: '記念日と思い出',
    description:
      '大切な人や出来事の記念日を記録し、特別な日をいつでも振り返るためのアプリ。',
    icon: kinenbiIcon,
    platforms: ['ios'],
    status: 'published',
    version: '1.1.0',
    appStoreUrl: 'https://apps.apple.com/jp/app/id6811298991',
    privacyPolicyUrl:
      'https://claude.ai/code/artifact/da3defc8-cd3a-41d4-b4c5-e3b943747197',
    supportUrl:
      'https://claude.ai/code/artifact/c394de4f-a91f-41fe-b4d0-ee3d501a23be',
  },
  {
    id: 'gohobi',
    name: 'gohobi',
    tagline: '我慢を記録して、欲しいものへ貯金',
    description:
      '頑張った自分へのごほうびを記録し、日々の小さな達成を楽しむためのアプリ。',
    icon: gohobiIcon,
    platforms: ['ios'],
    status: 'published',
    version: '1.0.0',
    appStoreUrl: 'https://apps.apple.com/jp/app/id6811485000',
    privacyPolicyUrl:
      'https://claude.ai/code/artifact/20c83e27-dbbe-432b-8909-8deb08417be0',
    supportUrl:
      'https://claude.ai/code/artifact/b8e0e850-30e7-4a3e-93e1-9fe6046bab53',
  },
  {
    id: 'noman',
    name: 'noman',
    tagline: '飲まない日を、ご褒美貯金に',
    description: '飲まない日を記録し、日々の継続をシンプルにサポートするアプリ。',
    icon: nomanIcon,
    platforms: ['ios'],
    status: 'published',
    version: '1.1.0',
    appStoreUrl: 'https://apps.apple.com/jp/app/id6811882577',
    privacyPolicyUrl: 'https://claude.ai/artifact/LcACgLjJprfhTJDcvd99yJ',
    supportUrl: 'https://claude.ai/artifact/BHVtuzuTpF55AfvqPHtSMs',
  },
  {
    id: 'nanikiru',
    name: '何着る？',
    tagline: '前回あの人と会った日の服がすぐわかる',
    description:
      '「今日は何を着よう？」という毎日の悩みを、シンプルにサポートするアプリ。',
    icon: nanikiruIcon,
    platforms: ['ios'],
    status: 'published',
    version: '1.0.0',
    appStoreUrl: 'https://apps.apple.com/jp/app/id6815745844',
    privacyPolicyUrl: 'https://claude.ai/artifact/R7nCUx1TNKU9PAKyXjz9Mt',
    supportUrl: 'https://claude.ai/artifact/4cMPxJEoeYARCF585k5TPq',
  },
  {
    id: 'madaaru',
    name: 'まだある？',
    tagline: '日用品のストック管理と買い物リスト',
    description:
      '家にあるものを記録して、買い忘れや二重買いを減らすための在庫管理アプリ。',
    icon: madaaruIcon,
    platforms: ['ios'],
    status: 'review',
    version: '1.0.0',
    privacyPolicyUrl: 'https://claude.ai/artifact/Spn6Qkk2gXyP1NgEq7Jb6d',
    supportUrl: 'https://claude.ai/artifact/9JdHHUBXFy1hG6K8jAkzTK',
  },
]
