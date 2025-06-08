import Icon from './Common/Icon'

export default function GitHubLink(props = {}) {
  return (
    <a
      target="_blank"
      rel="noreferrer"
      href="https://github.com/alleindrach/zmk-config"
      {...props}
    >
      <Icon collection="brands" name="github" />alleindrach/zmk-config
    </a>
  )
}
