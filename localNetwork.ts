import { networkInterfaces } from 'node:os'

const isPrivateIpv4Address = (address: string) => {
  const [first, second] = address.split('.').map(Number)
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  )
}

const isVirtualInterface = (name: string) =>
  /^(br-|bridge|docker|lo|utun|tun|tap|veth|vether|vEthernet|virbr|podman|cni|flannel|kube|wg|zt)/i.test(
    name,
  )

export const getLanAddress = () => {
  const addresses = Object.entries(networkInterfaces()).flatMap(([name, entries]) =>
    isVirtualInterface(name)
      ? []
      : (entries ?? [])
          .filter((entry) => entry.family === 'IPv4' && !entry.internal)
          .map((entry) => entry.address),
  )
  return addresses.find(isPrivateIpv4Address) ?? null
}
