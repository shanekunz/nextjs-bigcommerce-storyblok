import { FC } from 'react'
import NextHead from 'next/head'
import { DefaultSeo } from 'next-seo'
import config from '@config/seo.json'
import StoryblokService from '@lib/storyblok'

const Head: FC = () => {
  return (
    <>
      <DefaultSeo {...config} />
      <NextHead>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/site.webmanifest" key="site-manifest" />
        <script defer src={`//app.storyblok.com/f/storyblok-latest.js?t=${process.env.NEXT_PUBLIC_STORYBLOK_TOKEN}`} type="text/javascript" />
        <script defer type="text/javascript" dangerouslySetInnerHTML={{ __html: `var StoryblokCacheVersion = "${StoryblokService.getCacheVersion()}";` }} ></script>
      </NextHead>
    </>
  )
}

export default Head
