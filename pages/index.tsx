import { useState, useEffect } from 'react'
import rangeMap from '@lib/range-map'
import { Layout, DynamicComponent } from '@components/common'
import { ProductCard } from '@components/product'
import { Grid, Marquee, Hero, Banner } from '@components/ui'
import HomeAllProductsGrid from '@components/common/HomeAllProductsGrid'
import type { GetStaticPropsContext, InferGetStaticPropsType } from 'next'

import { getConfig } from '@framework/api'
import getAllProducts from '@framework/api/operations/get-all-products'
import getSiteInfo from '@framework/api/operations/get-site-info'
import getAllPages from '@framework/api/operations/get-all-pages'
import { SbEditableContent } from "storyblok-react";
import StoryblokService from '@lib/storyblok'

export async function getStaticProps({
  params,
  preview,
  locale,
}: GetStaticPropsContext) {
  if (params) StoryblokService.setQuery(params)
  if (preview) StoryblokService.devMode = true
  const config = getConfig({ locale })

  // Get Featured Products
  const { products: featuredProducts } = await getAllProducts({
    variables: { field: 'featuredProducts', first: 6 },
    config,
    preview,
  })

  // Get Best Selling Products
  const { products: bestSellingProducts } = await getAllProducts({
    variables: { field: 'bestSellingProducts', first: 6 },
    config,
    preview,
  })

  // Get Best Newest Products
  const { products: newestProducts } = await getAllProducts({
    variables: { field: 'newestProducts', first: 12 },
    config,
    preview,
  })

  const { categories, brands } = await getSiteInfo({ config, preview })
  const { pages } = await getAllPages({ config, preview })

  // These are the products that are going to be displayed in the landing.
  // We prefer to do the computation at buildtime/servertime
  const { featured, bestSelling } = (() => {
    // Create a copy of products that we can mutate
    const products = [...newestProducts]
    // If the lists of featured and best selling products don't have enough
    // products, then fill them with products from the products list, this
    // is useful for new commerce sites that don't have a lot of products
    return {
      featured: rangeMap(6, (i) => featuredProducts[i] ?? products.shift())
        .filter(nonNullable)
        .sort((a, b) => a.node.prices.price.value - b.node.prices.price.value)
        .reverse(),
      bestSelling: rangeMap(
        6,
        (i) => bestSellingProducts[i] ?? products.shift()
      ).filter(nonNullable),
    }
  })()

  const { data: { story } } = await StoryblokService.get('cdn/stories/home', {})

  return {
    props: {
      featured,
      bestSelling,
      newestProducts,
      categories,
      brands,
      pages,
      story
    },
    revalidate: 14400,
  }
}

const nonNullable = (v: any) => v

export default function Home({
  featured,
  bestSelling,
  brands,
  categories,
  newestProducts,
  story
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [storyContent, setStoryContent] = useState(story.content);
  useEffect(
    () => {
      StoryblokService.initEditor({ content: storyContent, setContent: setStoryContent })
    },
  )

  const components = storyContent.body.map((blok: SbEditableContent) => {
    return (<DynamicComponent blok={blok} key={blok._uid} />)
  });

  return (
    <div>
      { components }
      <Banner  />
      <Grid>
        {featured.slice(0, 3).map(({ node }, i) => (
          <ProductCard
            key={node.path}
            product={node}
            imgWidth={i === 0 ? 1080 : 540}
            imgHeight={i === 0 ? 1080 : 540}
            imgPriority
            imgLoading="eager"
          />
        ))}
      </Grid>
      <Hero />
      <HomeAllProductsGrid
        categories={categories}
        brands={brands}
        newestProducts={newestProducts}
      />
    </div>
  )
}

Home.Layout = Layout
